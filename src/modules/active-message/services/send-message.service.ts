import { Injectable, Logger } from '@nestjs/common';
import { SendActiveMessageData } from '../interfaces/send-active-message-data.interface';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { CacheService } from '../../_core/cache/cache.service';
import { EventsService } from '../../events/events.service';
import {
    ActivityType,
    ChannelIdConfig,
    ConversationCloseType,
    ConversationStatus,
    getNumberWith9,
    getWithAndWithout9PhoneNumber,
    IActiveMessageStatusChangedEvent,
    IdentityType,
    IWhatswebCheckPhoneNumberResponseEvent,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
} from 'kissbot-core';
import * as moment from 'moment';
import { v4 } from 'uuid';
import axios from 'axios';
import { ActiveMessageSettingService } from './active-message-setting.service';
import { ActiveMessageService } from './active-message.service';
import { castObjectIdToString, getWhatsappPhone, systemMemberId } from '../../../common/utils/utils';
import { ActiveMessageStatusService } from './active-message-status.service';
import { SendActiveMessageIncomingDataService } from './send-active-message-incoming-data.service';
import * as Sentry from '@sentry/node';
import { ResendNotProcessedActiveMessagesData } from '../interfaces/resend-not-processed-active-messages-data.interface';
import { ExternalDataService } from './external-data.service';
import { CheckConversationExistsData } from '../interfaces/check-conversation-exists.interface';
import { apiSendMessageIncomingCounter } from '../../../common/utils/prom-metrics';
import { ActiveMessageInternalActions } from '../interfaces/active-message-internal-actions';
import { uniqBy } from 'lodash';
import * as https from 'https';
import { canSendEventConversationCreatedByChannel } from '../../../common/utils/canSendEventConversationCreatedByChannel';
import { ExternalDataWorkspaceService } from './external-data-workspace.service';

interface CallbackError extends IActiveMessageStatusChangedEvent {
    message: string;
    token: string;
    externalId: string;
    status: number;
}

@Injectable()
export class SendMessageService {
    private readonly logger = new Logger(SendMessageService.name);
    private readonly RATE_LIMIT = 1000;

    constructor(
        private readonly cacheService: CacheService,
        private readonly eventsService: EventsService,
        private readonly activeMessageSettingService: ActiveMessageSettingService,
        private readonly activeMessageService: ActiveMessageService,
        private readonly activeMessageStatusService: ActiveMessageStatusService,
        private readonly sendActiveMessageIncomingDataService: SendActiveMessageIncomingDataService,
        private readonly externalDataService: ExternalDataService,
        private readonly externalDataWorkspaceService: ExternalDataWorkspaceService,
    ) {}

    getTotalEnqueuedLastMinuteCacheKey(token: string) {
        return `total_enqueued_last_minute:${token}`;
    }

    @CatchError()
    async resendNotProcessedActiveMessages(data: ResendNotProcessedActiveMessagesData) {
        const timestamp: number = data.timestamp || moment().subtract(1, 'hour').valueOf();
        const notProcessedList = await this.sendActiveMessageIncomingDataService.getNotProcessedIncomingData(
            timestamp,
            data.activeMessageSettingId,
            parseInt(data?.limit || '0'),
        );
        for (const notProcessed of notProcessedList) {
            try {
                await this.sendMessage(notProcessed);
                await this.sendActiveMessageIncomingDataService.updateRetryAt(notProcessed.id);
            } catch (e) {
                this.logger.error(e);
            }
        }
    }

    @CatchError()
    async enqueueMessage(data: SendActiveMessageData) {
        const { apiToken } = data;
        const setting = await this.activeMessageSettingService.findByApiToken(apiToken);
        if (!setting?.enabled) throw Exceptions.CANNOT_SEND_ACTIVE_MESSAGE_NOT_ENABLED;

        const workspaceIsDisable = await this.externalDataWorkspaceService.isWorkspaceDisabled(setting.workspaceId);
        if (workspaceIsDisable) throw Exceptions.WORKSPACE_IS_INACTIVE;

        const client = this.cacheService.getClient();
        const key = this.getTotalEnqueuedLastMinuteCacheKey(data.apiToken);
        const currentCount = await client.incr(key);

        if (currentCount > this.RATE_LIMIT) {
            if (currentCount === this.RATE_LIMIT + 1) {
                Sentry.captureEvent({
                    message: 'enqueueMessage EXCEPTION SPAM_SEND_MESSAGE_BY_TOKEN',
                    extra: {
                        data: data,
                    },
                });
            }
            throw Exceptions.SPAM_SEND_MESSAGE_BY_TOKEN;
        } else {
            await client.expire(key, 60);
        }

        if (!data.externalId) {
            data.externalId = v4();
        }
        let createdData: SendActiveMessageData = data;
        try {
            createdData = await this.sendActiveMessageIncomingDataService.create({
                ...data,
                activeMessageSettingId: setting.id,
            });
        } catch (e) {
            this.logger.error('enqueueMessage');
            this.logger.error(e);
            Sentry.captureException(e);
        }
        await this.eventsService.sendEvent({
            data: createdData,
            dataType: KissbotEventDataType.ANY,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.SEND_MESSAGE,
        });

        apiSendMessageIncomingCounter.labels(`${setting.id}`).inc();
    }

    @CatchError()
    async sendMessage(data: SendActiveMessageData) {
        const { apiToken } = data;
        const setting = await this.activeMessageSettingService.findByApiToken(apiToken);
        if (!setting.enabled) throw Exceptions.CANNOT_SEND_ACTIVE_MESSAGE_NOT_ENABLED;
        const { channelConfigToken } = setting;
        let validatingChannelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);
        // O channelconfig validador pode não ser o mesmo que tem que ser iniciada a conversa
        // nesse caso pega o primeiro channelConfig wrapper que é validador e está como LoggedIn
        if (!validatingChannelConfig.canValidateNumber) {
            validatingChannelConfig =
                (await this.externalDataService.getCanValidateLoggedInWrapperChannelConfig()) as any;
        }
        if (!validatingChannelConfig) {
            throw Exceptions.VALIDATE_CHANNEL_CONFIG_NOT_FOUND_ACTIVE_MESSAGE;
        }
        if (
            validatingChannelConfig.channelId !== ChannelIdConfig.gupshup &&
            validatingChannelConfig.configData?.status?.status !== 'LoggedIn'
        ) {
            throw Exceptions.CHANNEL_NOT_LOGGED_ACTIVE_MESSAGE;
        }
        const phoneId = getWhatsappPhone(data.phoneNumber);
        await this.sendMessageFromValidateNumber(
            {
                isValid: true,
                token: channelConfigToken,
                userId: channelConfigToken,
                phone: data.phoneNumber,
                phoneId: phoneId,
                whatsapp: phoneId,
            },
            data,
        );
    }

    @CatchError()
    public async sendMessageFromValidateNumber(
        event: IWhatswebCheckPhoneNumberResponseEvent,
        data: SendActiveMessageData,
    ) {
        const channelConfigToken = event.userId;
        const { apiToken } = data;
        const setting = await this.activeMessageSettingService.findByApiToken(apiToken);

        if (!data?.action && setting?.action) {
            data.action = setting.action;
        }

        const parsedNumber = event.phoneId;

        if (!event.isValid) {
            const status = await this.activeMessageStatusService.getGlobalStatus(-1);
            if (status) {
                await this.activeMessageService.create({
                    activeMessageSettingId: setting.id,
                    isCreatedConversation: false,
                    workspaceId: setting.workspaceId,
                    channelConfigId: channelConfigToken,
                    memberPhone: parsedNumber || event.phone,
                    externalId: data.externalId,
                    statusId: status.id,
                    campaignId: data.campaignId,
                    confirmationId: data.confirmationId,
                    messageError: status?.statusName || 'errorIsValid',
                });
                await this.sendCallbackMessage(
                    {
                        status: status.statusCode,
                        message: status.statusName,
                        externalId: data.externalId,
                        token: setting.apiToken,
                    },
                    setting?.callbackUrl,
                );
            }
            return;
        } else {
            try {
                // await this.contactService.updateValidContact(
                //     setting.workspaceId,
                //     event.phone,
                //     event.phoneId
                // )
            } catch (e) {
                this.logger.error(`Error updating contact ${e}`);
            }
        }

        const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);
        const workspaceId = channelConfig.workspaceId;

        if (!channelConfig.enable) {
            const status = await this.activeMessageStatusService.getGlobalStatus(-3);
            if (status) {
                await this.activeMessageService.create({
                    activeMessageSettingId: setting.id,
                    isCreatedConversation: false,
                    workspaceId: setting.workspaceId,
                    channelConfigId: channelConfigToken,
                    memberPhone: parsedNumber || event.phone,
                    externalId: data.externalId,
                    statusId: status.id,
                    campaignId: data.campaignId,
                    confirmationId: data.confirmationId,
                    messageError: status?.statusName || 'errorNotEnable',
                });
                await this.sendCallbackMessage(
                    {
                        status: status.statusCode,
                        message: status.statusName,
                        externalId: data.externalId,
                        token: setting.apiToken,
                    },
                    setting?.callbackUrl,
                );
            }
            this.logger.log('ignoring send message');
            throw Exceptions.CANNOT_SEND_MESSAGE_ON_NOT_ENABLED_CHANNEL;
        }
        const contact = await this.externalDataService.findOneContact({
            whatsapp: parsedNumber,
            workspaceId: channelConfig.workspaceId,
        });

        let conversation: any;
        try {
            conversation = await this.externalDataService.getConversationByMemberIdListAndChannelConfig(
                getWithAndWithout9PhoneNumber(parsedNumber),
                channelConfig.token,
            );
        } catch (e) {
            Sentry.captureEvent({
                message: 'SendMessageService try getConversationByMemberIdListAndChannelConfig',
                extra: {
                    data: e,
                },
            });
            console.log('SendMessageService try getConversationByMemberIdListAndChannelConfig', e);
            conversation = await this.externalDataService.findOpenedConversationByMemberIdAndChannelId(
                parsedNumber,
                channelConfig.channelId,
                channelConfig.workspaceId,
            );
        }

        if (!conversation) {
            conversation = await this.externalDataService.findOpenedConversationByMemberIdAndChannelId(
                parsedNumber,
                channelConfig.channelId,
                channelConfig.workspaceId,
            );
        }

        // let conversation: any = await this.externalDataService.findOpenedConversationByMemberIdAndChannelId(
        //     parsedNumber,
        //     channelConfig.channelId,
        //     channelConfig.workspaceId,
        // );

        if (!setting.sendMessageToOpenConversation && conversation) {
            const conversationId = conversation._id.toJSON ? conversation._id.toJSON() : conversation._id;
            const status = await this.activeMessageStatusService.getGlobalStatus(-2);
            await this.activeMessageService.create({
                activeMessageSettingId: setting.id,
                conversationId: conversationId,
                isCreatedConversation: false,
                workspaceId: conversation.workspace._id,
                contactId: castObjectIdToString(contact?._id),
                channelConfigId: channelConfig.token,
                memberPhone: parsedNumber,
                externalId: data.externalId,
                statusId: status.id,
                campaignId: data.campaignId,
                confirmationId: data.confirmationId,
                messageError: status?.statusName || 'errorOpenCvs',
            });
            await this.sendCallbackMessage(
                {
                    status: status.statusCode,
                    message: status.statusName,
                    externalId: data.externalId,
                    token: setting.apiToken,
                    conversationId,
                },
                setting?.callbackUrl,
            );
            return;
        }

        let attributes = (data.attributes || []).map((attr) => ({
            ...attr,
            type: attr.type || '@sys.any',
        }));

        try {
            attributes = uniqBy(attributes, 'name');
            attributes.push({
                name: 'default_active_setting_id',
                value: setting.id,
                type: '@sys.any',
                label: null,
            });
        } catch (e) {
            Sentry.captureEvent({
                message: 'SendMessageService uniq attributes',
                extra: {
                    data: JSON.stringify(e),
                },
            });
        }

        let isCreatedConversation = false;
        if (!conversation) {
            let whatsappExpiration: number | undefined;

            if (channelConfig.channelId == ChannelIdConfig.gupshup) {
                const expirationSession =
                    await this.externalDataService.findSessionByWorkspaceAndNumberAndChannelConfigId(
                        workspaceId,
                        parsedNumber,
                        channelConfig,
                    );
                whatsappExpiration = expirationSession?.whatsappExpiration || moment().valueOf();
            }

            const privateData = this.externalDataService.getChannelConfigPrivateData(channelConfig);

            const bot = await this.externalDataService.getOneBot(channelConfig.botId);
            const members = [];
            let expirationTime: number;
            if (setting.expirationTime && setting.expirationTimeType) {
                const now = moment();
                const expirationTimeMoment = moment().add(setting.expirationTime, setting.expirationTimeType);
                var duration = moment.duration(expirationTimeMoment.diff(now));
                expirationTime = duration.asMilliseconds();
            }

            let suspendedUntil: number;
            if (setting.suspendConversationUntilTime && setting.suspendConversationUntilType) {
                suspendedUntil = moment()
                    .add(setting.suspendConversationUntilTime, setting.suspendConversationUntilType)
                    .valueOf();
            }

            if (event.isValid) {
                members.push();
            }
            members.push(
                {
                    channelId: 'system',
                    id: systemMemberId,
                    name: 'system',
                    type: IdentityType.system,
                },
                {
                    id: parsedNumber,
                    name: contact?.name || data?.contactName || parsedNumber,
                    channelId: channelConfig.channelId,
                    type: IdentityType.user,
                    phone: contact?.phone || parsedNumber,
                    contactId: contact?._id,
                    disabled: !event.isValid,
                },
            );

            if (!data.teamId && data.action) {
                const botMember = {
                    id: channelConfig.botId,
                    name: bot.name,
                    channelId: ChannelIdConfig.kissbot,
                    type: IdentityType.bot,
                    disabled: false,
                };
                members.push(botMember);
            }

            let teamId = data.teamId;
            if (!!data.action) {
                teamId = undefined;
            }

            let tags = [];
            if (setting.tags?.length) {
                const workspaceTags = await this.externalDataService.getWorkspaceTags(workspaceId);
                if (workspaceTags?.length) {
                    tags = workspaceTags.filter((tag) => setting.tags.includes(tag.name));
                }
            }

            let createdByChannel = setting?.objective || ChannelIdConfig.api;
            if (data.action) {
                if (data.action == ActiveMessageInternalActions.confirmacao) {
                    createdByChannel = ChannelIdConfig.confirmation;
                }
                if (data.action == ActiveMessageInternalActions.lembrete) {
                    // para lembrete por enquanto ta deletando a action pois deve apenas finalizar o atendimento
                    if (data?.omitAction) {
                        delete data.action;
                    }
                    createdByChannel = ChannelIdConfig.reminder;
                }
                if (data.action == ActiveMessageInternalActions.pesquisa_satisfacao) {
                    // para nps por enquanto ta deletando a action pois deve apenas finalizar o atendimento
                    if (data?.omitAction) {
                        delete data.action;
                    }
                    createdByChannel = ChannelIdConfig.nps;
                }
                if (data.action == ActiveMessageInternalActions.laudo_medico) {
                    // para medical_report por enquanto ta deletando a action pois deve apenas finalizar o atendimento
                    if (data?.omitAction) {
                        delete data.action;
                    }
                    createdByChannel = ChannelIdConfig.medical_report;
                }
                if (data.action == ActiveMessageInternalActions.notificacao_agendamento) {
                    // para schedule_notification por enquanto ta deletando a action pois deve apenas finalizar o atendimento
                    if (data?.omitAction) {
                        delete data.action;
                    }
                    createdByChannel = ChannelIdConfig.schedule_notification;
                }
                if (data.action == ActiveMessageInternalActions.recuperacao_agendamento_perdido) {
                    createdByChannel = ChannelIdConfig.recover_lost_schedule;
                }
                if (data.action == ActiveMessageInternalActions.nps_avaliacao) {
                    createdByChannel = ChannelIdConfig.nps_score;
                }
                if (data.action == ActiveMessageInternalActions.solicitacao_documentos) {
                    // para documents_request por enquanto ta deletando a action pois deve apenas finalizar o atendimento
                    if (data?.omitAction) {
                        delete data.action;
                    }
                    createdByChannel = ChannelIdConfig.documents_request;
                }
                if (data.action == ActiveMessageInternalActions.mkt_ativo) {
                    // para active_mkt por enquanto ta deletando a action pois deve apenas finalizar o atendimento
                    if (!data?.omitAction) {
                        data.action = setting?.action;
                    }
                    createdByChannel = ChannelIdConfig.active_mkt;
                }
            }
            if (data.campaignId) {
                createdByChannel = ChannelIdConfig.campaign;
            }

            //verifica se possui featureFlag rating ativa
            let enableRating = false;
            try {
                enableRating = await this.externalDataWorkspaceService.isWorkspaceRatingEnabled(setting.workspaceId);
            } catch (e) {
                Sentry.captureEvent({
                    message: 'SendMessageService get isWorkspaceRatingEnabled',
                    extra: {
                        error: e,
                    },
                });
            }

            const conversationToSave = {
                createdByChannel,
                token: channelConfig.token,
                hash: channelConfig.token,
                workspace: channelConfig.workspace,
                state: ConversationStatus.open,
                assignedToTeamId: teamId,
                priority: data.priority,
                privateData,
                whatsappExpiration,
                attributes,
                members,
                expirationTime,
                suspendedUntil,
                shouldRequestRating: !!data?.action && enableRating,
                campaignId: data.campaignId,
                confirmationId: data.confirmationId,
                tags,
                endMessage: setting?.endMessage,
            };
            conversation = await this.externalDataService.createConversation(conversationToSave);
            isCreatedConversation = true;
        } else {
            if (attributes.length > 0) {
                await this.externalDataService.addAttributesToConversation(
                    conversation._id,
                    attributes,
                    setting.workspaceId,
                );
            }
        }

        const userMember = conversation.members.find((mem) => mem.type === IdentityType.user);
        const agentMember = conversation.members.find((mem) => mem.type === IdentityType.agent);
        let systemMember = conversation.members.find((mem) => mem.type === IdentityType.system);
        const botMember = conversation.members.find((mem) => mem.type === IdentityType.bot && !mem.disabled);
        const conversationId = conversation._id.toJSON ? conversation._id.toJSON() : conversation._id;
        await this.activeMessageService.create({
            activeMessageSettingId: setting.id,
            conversationId,
            isCreatedConversation,
            workspaceId: conversation.workspace._id,
            contactId: castObjectIdToString(contact?._id),
            channelConfigId: channelConfig.token,
            memberPhone: parsedNumber,
            externalId: data.externalId,
            campaignId: data.campaignId,
            confirmationId: data.confirmationId,
        });

        if (!systemMember) {
            systemMember = {
                channelId: 'system',
                id: systemMemberId,
                name: 'system',
                type: IdentityType.system,
            };
            await this.externalDataService.addMember(conversation._id, systemMember, false);
        }
        let templateVariableValues: string[];

        const templateId = setting.templateId || data.templateId;

        if (!!event.isValid) {
            try {
                if (!data.text && templateId) {
                    const values = (data.attributes || []).map((attr) => {
                        return { key: attr.name, value: attr.value };
                    });

                    const text = await this.externalDataService.getParsedTemplate(templateId, values);
                    templateVariableValues = await this.externalDataService.getTemplateVariableValues(
                        templateId,
                        values,
                    );
                    data.text = text;
                }
            } catch (e) {
                try {
                    Sentry.captureEvent({
                        message: 'SendMessageService parse template',
                        extra: {
                            data: JSON.stringify(e),
                        },
                    });
                } catch (e2) {
                    Sentry.captureEvent({
                        message: 'SendMessageService parse template retry',
                        extra: {
                            data: 'failed send sentry parse template',
                        },
                    });
                    this.logger.error('SendMessageService 2');
                    this.logger.error(e2);
                }
                this.logger.error('====================');
                this.logger.error('SendMessageService 1');
                this.logger.error(e);
            }
        }
        //Envia texto que veio pelo payload da request
        if (data.text && !!event.isValid) {
            const activity: any = {
                type: ActivityType.message,
                from: systemMember,
                text: data.text,
                data: {
                    omitSocket: !canSendEventConversationCreatedByChannel(conversation),
                },
                conversationId,
                templateId: templateId,
                templateVariableValues: templateVariableValues,
            };
            await this.externalDataService.dispatchMessageActivity(conversation, activity);
        }
        // Envia action como se fosse o usuário pra setar o contexto do bot
        if (userMember && botMember && data.action && !!event.isValid) {
            const activity = {
                type: ActivityType.event,
                from: userMember,
                name: data.action,
                omitExit: true,
                conversationId,
            };
            await this.externalDataService.dispatchMessageActivity(conversation, activity);
        }
        if (event.isValid && !data.teamId && !data.action) {
            // só finaliza se não tiver nenhum agente na conversa
            if (!agentMember && conversation.state == ConversationStatus.open) {
                await this.externalDataService.closeConversation(
                    conversation,
                    conversationId,
                    systemMember,
                    ConversationCloseType.active_message_no_action,
                );
            }
        }
        const status = await this.activeMessageStatusService.getGlobalStatus(-4);
        if (status) {
            await this.sendCallbackMessage(
                {
                    status: status.statusCode,
                    message: status.statusName,
                    externalId: data.externalId,
                    token: setting.apiToken,
                    conversationId,
                },
                setting?.callbackUrl,
            );
        }
    }

    private async sendCallbackMessage(data: CallbackError, url?: string) {
        try {
            try {
                await this.eventsService.sendEvent({
                    data: {
                        status: data.status,
                        message: data.message,
                        externalId: data.externalId,
                        token: data.token,
                        conversationId: data.conversationId,
                    },
                    dataType: KissbotEventDataType.ANY,
                    source: KissbotEventSource.KISSBOT_API,
                    type: KissbotEventType.ACTIVE_MESSAGE_STATUS_CHANGED,
                });
            } catch (e) {
                this.logger.error('sendCallbackMessage send event', e);
            }
            if (url) {
                const httpsAgent = new https.Agent({
                    rejectUnauthorized: false,
                });

                await axios.post(url, data, {
                    httpsAgent,
                });
            }
        } catch (e) {}
    }

    @CatchError()
    async checkConversationExists(data: CheckConversationExistsData) {
        const setting = await this.activeMessageSettingService.findByApiToken(data.apiToken);

        const workspaceIsDisable = await this.externalDataWorkspaceService.isWorkspaceDisabled(setting.workspaceId);
        if (workspaceIsDisable) throw Exceptions.WORKSPACE_IS_INACTIVE;

        const hasConversation = await this.externalDataService.hasOpenedConversationByPhoneNumberAndWorkspaceId(
            data.phoneNumber,
            setting.workspaceId,
        );
        return { hasConversation };
    }
}
