import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import * as moment from 'moment';
import { v4 } from 'uuid';
import {
    ChannelIdConfig,
    AckType,
    IActivityAck,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
    GupshupMessage,
    convertPhoneNumber,
    IConversationWhatsappExpirationUpdated,
    ActivityType,
} from 'kissbot-core';
import { CreateConversationService } from './../../../conversation/services/create-conversation.service';
import { ActivityDto } from './../../../conversation/dto/activities.dto';
import { Conversation } from './../../../conversation/interfaces/conversation.interface';
import { ChannelConfigService } from './../../../channel-config/channel-config.service';
import { GupshupUtilService } from './gupshup-util.service';
import { CacheService } from './../../../_core/cache/cache.service';
import { ActivityService } from './../../../activity/services/activity.service';
import { EventsService } from './../../../events/events.service';
import { ConversationService } from './../../../conversation/services/conversation.service';
import { AttachmentService } from './../../../attachment/services/attachment.service';
import { ActiveMessageService } from './../../../active-message/services/active-message.service';
import { GupshupBillingEventService } from './gupshup-billing-event.service';
import { GupshupIdHashService } from './gupshup-id-hash.service';
import { MismatchWaidService } from './mismatch-waid.service';
import { ContactService } from '../../../contact/services/contact.service';
import { getWithAndWithout9PhoneNumber } from 'kissbot-core';
import { UploadingFile } from '../../../../common/interfaces/uploading-file.interface';
import { TemplateMessageService } from '../../../template-message/services/template-message.service';
import { TemplateStatus } from '../../../template-message/schema/template-message.schema';
import { KafkaService } from '../../../_core/kafka/kafka.service';
import { TemplateCategory } from './partner-api.service';
import { ReferralService } from './referral.service';
import { SourceTypeEnum } from '../models/referral.entity';
import { castObjectIdToString } from '../../../../common/utils/utils';
import axios from 'axios';
import { ackProcessLatencyLocation } from '../../../../common/utils/prom-metrics';

@Injectable()
export class GupshupService {
    private readonly logger = new Logger(GupshupService.name);

    constructor(
        private readonly cacheService: CacheService,
        private readonly channelConfigService: ChannelConfigService,
        private readonly createConversationService: CreateConversationService,
        private readonly gupshupUtilService: GupshupUtilService,
        private readonly activityService: ActivityService,
        private readonly conversationService: ConversationService,
        private readonly attachmentService: AttachmentService,
        public readonly eventsService: EventsService,
        private readonly activeMessageService: ActiveMessageService,
        private readonly gupshupBillingEventService: GupshupBillingEventService,
        private readonly gupshupIdHashService: GupshupIdHashService,
        private readonly mismatchWaidService: MismatchWaidService,
        private readonly contactService: ContactService,
        private readonly templateMessageService: TemplateMessageService,
        private kafkaService: KafkaService,
        private readonly referralService: ReferralService,
    ) {}

    async handleWhatsappMessage(message: GupshupMessage, channelConfigToken: string, workspaceId?: string) {
        let result = null;
        try {
            if (message.type === 'billing-event') {
                //[17/11/22] - VAMOS IGNORAR POR HORA, IOPS DO POSTGRES
                //await this.handleBillingEvent(message, channelConfigToken);
                return;
            }

            if ((message.type as any) === 'account-event') {
                Sentry.captureEvent({
                    message: 'gupshup: account-event',
                    extra: {
                        data: JSON.stringify(message),
                    },
                });
            }
            if (message.type === 'message') {
                await this.afterReceiveMessage(message, channelConfigToken, false);

                try {
                    if (await this.activityService.existsActivityByHash(message.payload.id)) {
                        this.logger.warn('duplicate activity', JSON.stringify(message));
                        return;
                    }
                } catch (e) {
                    console.log('quebrou handleWhatsappMessage', e);
                }

                switch (message.payload.type) {
                    case 'text': {
                        result = await this.processTextMessage(message, channelConfigToken);
                        break;
                    }
                    case 'image': {
                        result = await this.processMediaMessage(message, channelConfigToken);
                        break;
                    }
                    case 'audio': {
                        result = await this.processMediaMessage(message, channelConfigToken);
                        break;
                    }
                    case 'file': {
                        result = await this.processMediaMessage(message, channelConfigToken);
                        break;
                    }
                    case 'video': {
                        result = await this.processMediaMessage(message, channelConfigToken);
                        break;
                    }
                    case 'button_reply': {
                        result = await this.processListMessage(message, channelConfigToken);
                        break;
                    }
                    case 'quick_reply': {
                        result = await this.processTextMessage(message, channelConfigToken);
                        break;
                    }
                    case 'list_reply': {
                        result = await this.processListMessage(message, channelConfigToken);
                        break;
                    }
                    case 'sticker': {
                        result = await this.processMediaMessage(message, channelConfigToken);
                        break;
                    }
                    case 'contact': {
                        result = await this.processContactMessage(message, channelConfigToken);
                        break;
                    }
                    case 'reaction': {
                        result = await this.processReactionMessage(message, channelConfigToken);
                        break;
                    }
                    default: {
                        console.log('GUPSHUP message nao tratada', JSON.stringify(message));
                    }
                }
            } else if (message.type === 'message-event') {
                await this.handleWhatsappAck(message, channelConfigToken, workspaceId);
            } else if (message.type === 'user-event') {
                this.afterReceiveCall(message, channelConfigToken);
                return;
            } else if (message.type === 'template-event') {
                this.handleTemplateEvent(message, channelConfigToken);
                return;
            } else {
                console.log('GUPSHUP handleWhatsappMessage nao tratada', JSON.stringify(message));
            }

            this.afterReceiveCall(message, channelConfigToken);

            return result;
        } catch (e) {
            console.log(e);

            Sentry.captureException(e);

            await this.afterReceiveMessage(message, channelConfigToken, true);

            throw e;
        }
    }

    private async handleTemplateEvent(message: GupshupMessage, channelConfigToken: string) {
        try {
            let templateCategory;
            if (typeof message?.payload?.category == 'string') {
                templateCategory = message.payload.category.toUpperCase() as TemplateCategory;
            } else if (typeof message?.payload?.category == 'object' && message?.payload?.category?.new) {
                templateCategory = message.payload.category.new as TemplateCategory;
            }

            if (!message?.payload?.status) {
                Sentry.captureEvent({
                    message: 'Template event no status: handleTemplateEvent',
                    extra: {
                        channelConfigToken,
                        message: JSON.stringify(message),
                    },
                });
            }
            await this.sendWebHookUpdateStatusTemplate(message, channelConfigToken);
            await this.templateMessageService.updateTemplateApprovalStatusAndWhatsappId(
                channelConfigToken,
                message.payload.elementName,
                message.payload.id,
                message.payload.status as TemplateStatus,
                message.payload.rejectedReason,
                templateCategory,
            );
        } catch (e) {
            this.logger.error('handleTemplateEvent');
            this.logger.error(e);
        }
    }

    private async sendWebHookUpdateStatusTemplate(message: GupshupMessage, channelConfigToken: string) {
        try {
            let content = '';

            if ((message?.payload?.type as any) !== 'category-update') {
                return;
            }

            if (
                typeof message?.payload?.category == 'object' &&
                ((message?.payload?.category?.old === 'UTILITY' && message?.payload?.category?.new === 'MARKETING') ||
                    ((message?.payload?.category as any)?.correct === 'MARKETING' &&
                        (message?.payload?.category as any)?.current === 'UTILITY'))
            ) {
                const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

                if (channelConfig) {
                    content = `**Mudança de categoria do template**\n\n
Workspace: ${channelConfig.workspace.name}\n
workspaceId: ${channelConfig.workspaceId}\n
Link do template: ${`https://app.botdesigner.io/settings/templates/${message.payload?.elementName}`}\n
appName: ${message?.app || channelConfig?.configData?.appName}\n
Nome do canal: ${channelConfig.name}\n
channelConfigToken: ${channelConfigToken}\n
channelConfigId: ${channelConfig._id}`;
                }
            }

            if (!content) {
                return;
            }

            if (process.env.NODE_ENV !== 'local') {
                const cbUrl =
                    'https://chat.googleapis.com/v1/spaces/AAAAdxGSXVU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=hT6TW8b3cbitjazDzoHHl16WqwOaiCTh2yFLMTFl6qc';

                axios
                    .post(cbUrl, {
                        text: content,
                    })
                    .then();
            }
        } catch (error) {
            Sentry.captureEvent({
                message: 'Template event change status: sendWebHookUpdateStatusTemplate',
                extra: {
                    channelConfigToken,
                    message: JSON.stringify(message),
                },
            });
            console.log(error);
        }
    }

    async handleWhatsappAck(message: GupshupMessage, channelConfigToken: string, workspaceId?: string) {
        if (message.type === 'message-event') {
            const payload = message.payload;
            const id = payload.gsId || payload.id;
            switch (message.payload.type) {
                case 'sent': {
                    //não esta mais sendo usado session count.
                    //this.updateConversationWhatsappSessionByAck(message, channelConfigToken);
                    this.activeMessageService.checkMissingReceived(message.payload.destination, channelConfigToken);
                    await this.updateActivityAck(id, AckType.ServerAck, channelConfigToken, message, workspaceId);
                    this.afterReceiveAck(id, AckType.ServerAck, message);
                    break;
                }
                case 'delivered': {
                    await this.updateActivityAck(id, AckType.DeliveryAck, channelConfigToken, message, workspaceId);
                    this.afterReceiveAck(id, AckType.DeliveryAck, message);
                    break;
                }
                case 'read': {
                    this.activeMessageService.checkMissingRead(message.payload.destination, channelConfigToken);
                    await this.updateActivityAck(id, AckType.Read, channelConfigToken, message, workspaceId);
                    this.afterReceiveAck(id, AckType.Read, message);
                    break;
                }
                case 'failed': {
                    // console.log('GUPSHUP ERROR', JSON.stringify(message));
                    await this.processError({
                        gsId: id,
                        errorCode: payload.payload.code,
                        message: JSON.stringify(message.payload),
                        phoneNumber: message.payload.destination,
                    });
                    break;
                }
                case 'enqueued': {
                    break;
                }
                case 'mismatch': {
                    await this.handleMismatchEvent(message, channelConfigToken);
                    break;
                }
                default: {
                    // console.log('GUPSHUP Message-event nao tratada', JSON.stringify(message))
                }
            }
        }
    }

    private async handleBillingEvent(message: GupshupMessage, channelConfigToken: string) {
        const memberId = message.payload.references.destination;
        const client = await this.cacheService.getClient();

        let conversationId: string = await client.get(
            this.createConversationService.getConversationCacheKey(memberId, channelConfigToken),
        );
        if (!conversationId) {
            const key = this.gupshupUtilService.getActivtyGupshupIdHashCacheKey(message.payload.gsId);
            const hash = await client.get(key);
            const activity = await this.activityService.getOneByHash(hash);
            conversationId = activity?.conversationId;
        }
        await this.gupshupBillingEventService.create({
            channelConfigToken,
            deductionModel: message.payload.deductions.model,
            deductionSource: message.payload.deductions.source,
            deductionType: message.payload.deductions.type,
            referenceConversationId: message.payload.references.conversationId,
            referenceDestination: message.payload.references.destination,
            referenceGsId: message.payload.references.gsId,
            referenceId: message.payload.references.id,
            conversationId,
            gsTimestamp: message.timestamp,
        });
    }

    private async afterReceiveAck(gsId: string, ack: any, message: GupshupMessage) {
        //POR HORA NAO ESTA SENDO USADO.
    }

    private async afterReceiveCall(message: GupshupMessage, token: string, isError: boolean = false) {
        /*

        --> Ignorar debug por hora

        try {
            const client = await this.cacheService.getClient();

            let key: string = null;

            //incremente no redis as mensagens recebidas pelo channel
            key = 'gupshup:' + moment().startOf('day').format('YYYYMMDD') + ':stats:' + process.env.NODE_ENV;
            let minute = moment().format('YYYYMMDDHHmm');
            let count = await client.zincrby(key, 1, minute);
            if (count == '1') {
                client.expire(key, 86400 * 1);
            }
        } catch (e) {
            console.log(e);
        }

        */
    }

    private async afterReceiveMessage(message: GupshupMessage, token: string, isError: boolean = false) {
        //Guarda as mensagens que chegaram para eventual conferencia.
        /*

        -->> ignorar debug por hora

        try {
            const client = await this.cacheService.getClient();

            let key: string = null;

            if (!isError) {
                //incremente no redis as mensagens recebidas pelo channel
                key = 'gupshup:' + moment().utc().startOf('day').format('YYYYMMDD') + ':received';
                let count = await client.zincrby(key, 1, token);
                if (count == '1') {
                    client.expire(key, 86400 * 35);
                }
            }

            //adiciona no redis todas as mensagens enviadas pelo paciente
            key = 'gupshup:msg:' + token + ':' + message.payload.sender.phone + ':received' + (isError ? ':error' : '');
            const c = await client.hset(key, message.timestamp + '', JSON.stringify(message));
            if (c == 1) {
                client.expire(key, 86400 * 1);
            }
        } catch (e) {
            console.log(e);
        }

        */
    }

    private async awaiterDalay(phoneNumber: string, channelConfigToken: string) {
        const secondsToWait = await this.cacheService.incr(`${phoneNumber}:${channelConfigToken}`, 10);
        await new Promise((r) => setTimeout(r, (secondsToWait - 1) * 500));
    }

    // async handleConversationWhatsAppExpired(payload: GupshupPayload) {
    //     if (!payload.gsId) {
    //         return;
    //     }

    //     const activity = await this.activityService.getOneByHash(payload.gsId);

    //     if (activity && activity.isHsm) {
    //         return await this.updateConversationWhatsappExpiration(activity.conversationId, payload.destination);
    //     }
    // }

    private async handleMismatchEvent(data: GupshupMessage, channelConfigToken: string) {
        // this.logger.debug(`handleMismatchEvent DEBUG`);
        // this.logger.debug(`DEBUG:` + JSON.stringify(data));
        try {
            const options = getWithAndWithout9PhoneNumber(data.payload?.payload?.phone);
            const phoneNumber = data.payload?.payload?.phone;
            const waid = data.payload?.payload?.wa_id;
            await this.mismatchWaidService.saveMismatch(phoneNumber, waid);
            const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
            if (channelConfig) {
                await this.contactService.updateContactWhatsapp(options, waid, channelConfig.workspaceId);
            }
        } catch (e) {
            this.logger.error('handleMismatchEvent');
            this.logger.error(e);
            Sentry.captureException(e);
        }
    }

    // os ack que estao comentados eram usados antes da migração dos apps na Gupshup para cloudApi, deve permanecer para historico.
    private async processError({
        gsId,
        errorCode,
        message,
        phoneNumber,
        channelConfigToken,
        workspaceId,
    }: {
        gsId: string;
        errorCode: number;
        message?: string;
        phoneNumber?: string;
        channelConfigToken?: string;
        workspaceId?: string;
    }) {
        class GupshupError extends Error {
            constructor(message: any) {
                super(message);
                this.name = `GupshupError:${message}`;
            }
        }
        let ackType: AckType;
        let ackTypeNotDefined: boolean = false;
        let ackInvalidNumber: boolean = false;
        switch (errorCode) {
            case 500: {
                ackType = AckType.Error500;
                Sentry.captureException(new GupshupError(message));
                break;
            }
            case 503: {
                // Error Failed connection - permitir reenvio da mensagem
                ackType = AckType.Error500;
                break;
            }
            case 1002: {
                ackType = AckType.NumberDontExists;
                ackInvalidNumber = true;
                break;
            }
            // case 1003: {
            //     ackType = AckType.CheckWalletBalance;
            //     break;
            // }
            // case 1004: {
            //     ackType = AckType.UserInactiveAndTemplateMessageDisabled;
            //     break;
            // }
            // case 1005: {
            //     ackType = AckType.AccessDenied;
            //     break;
            // }
            // case 1006: {
            //     ackType = AckType.UserInactiveAndNotOptedinTemplate;
            //     break;
            // }
            // case 1009: {
            //     ackType = AckType.UserInactiveAndTemplateDontMatch;
            //     break;
            // }
            // case 407: {
            //     ackType = AckType.UserInactiveAndNotOptedinTemplateFromFacebook;
            //     break;
            // }
            case 472:
            case 130472: {
                ackType = AckType.UserExperiment;
                break;
            }
            // case 470: {
            //     ackType = AckType.InvalidReengagementMessage;
            //     break;
            // }
            // case 1007: {
            //     ackType = AckType.UserInactiveAndNotOptedinAndTemplateNotMatch;
            //     break;
            // }
            // case 1008: {
            //     ackType = AckType.UserInactiveOrNotOptedin;
            //     break;
            // }
            // case 1010: {
            //     ackType = AckType.InvalidMediaUrl;
            //     break;
            // }
            // case 1011: {
            //     ackType = AckType.InvalidMediaSize;
            //     break;
            // }
            case 1013: {
                ackType = AckType.UserDontExists;
                ackInvalidNumber = true;
                break;
            }
            // case 1026: {
            //     ackType = AckType.UserBlockingTemplate;
            //     break;
            // }
            // case 2001: {
            //     ackType = AckType.TemplateMissing;
            //     break;
            // }
            // case 2000: {
            //     ackType = AckType.MissingTemplateParams;
            //     break;
            // }
            // case 2017: {
            //     ackType = AckType.CharacterPolicyViolated;
            //     break;
            // }
            // case 2005: {
            //     ackType = AckType.TextOfTemplateTooLong;
            //     break;
            // }
            case 4003: {
                ackType = AckType.NoTemplateMatch;
                break;
            }
            // case 408: {
            //     ackType = AckType.InvalidMessagePendingTooLong;
            //     break;
            // }
            // case 492: {
            //     ackType = AckType.TemplateMarketingBlockedByUser;
            //     break;
            // }
            // case 1014: {
            //     ackType = AckType.ErrorMatchMedia;
            //     break;
            // }
            // case 1000: {
            //     ackType = AckType.UnsupportedImageFormat;
            //     break;
            // }
            case 1001: {
                ackType = AckType.MessageTooLong;
                break;
            }
            case 131026: {
                ackType = AckType.MessageUndeliverable;
                ackInvalidNumber = true;
                break;
            }
            case 131049: {
                ackType = AckType.LimitTemplateMarketingExceeded;
                break;
            }
            case 133010: {
                ackType = AckType.PhoneNotRegisteredOnWhatsappBusiness;
                break;
            }
            default: {
                ackType = -errorCode;
                ackTypeNotDefined = true;
            }
        }

        if (ackType) {
            this.activeMessageService.checkMissingReceived(phoneNumber, channelConfigToken, String(ackType));
            const hash = await this.updateActivityAck(gsId, ackType, channelConfigToken, null, workspaceId);
            if (
                (ackType == AckType.NumberDontExists ||
                    ackType == AckType.UserDontExists ||
                    ackType == AckType.MessageUndeliverable) &&
                !!ackInvalidNumber
            ) {
                this.handleNumberDontExistsCallback(hash);
            }
            return;
        }
        if (!!ackTypeNotDefined) {
            Sentry.captureEvent({
                message: 'Not finded gupshup acktype',
                extra: {
                    message,
                    gsId,
                    errorCode,
                    phoneNumber,
                },
            });
        }

        this.logger.debug('message', message);
        console.log('errorCode not found: ', errorCode);
    }

    async handleNumberDontExistsCallback(hash: string) {
        const gsHashId = await this.gupshupIdHashService.findByHash(hash);
        if (gsHashId) {
            await this.conversationService.updateConversationInvalidNumber(
                gsHashId.conversationId,
                gsHashId.workspaceId,
            );
        }
    }

    private async processContactMessage(message: GupshupMessage, channelConfigToken: string) {
        this.activeMessageService.checkMissingResponse(message.payload.sender.phone, channelConfigToken);
        await this.gupshupUtilService.setGupshupIdHash(message.payload.id, message.payload.id);
        const attachments = message?.payload?.payload?.contacts
            ?.map((contact) => this.gupshupUtilService.convertContactToAttachment(contact))
            .filter((attachment) => !!attachment.content);

        if (!attachments.length) {
            console.log('processContactMessage.attachments', JSON.stringify(attachments));
            console.log('processContactMessage.message', JSON.stringify(message));
            console.log('processContactMessage.channelConfigToken', channelConfigToken);
        }

        const quoted = await this.getQuoted(message);
        const memberId = this.gupshupUtilService.getMemberId(message);

        let startActivity: ActivityDto;

        let conversation;
        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processContactMessage');
            console.error(e);
            Sentry.captureException(e);
        }
        if (!conversation) {
            conversation = await this.createConversationService.getExistingConversation(channelConfigToken, memberId);
        }

        // let conversation = await this.getExistingConversation(
        //     channelConfigToken,
        //     memberId);

        if (!conversation) {
            const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.createConversationService.getConversation({
                activityHash: message.payload.id,
                activityText: message?.payload?.payload?.text || '',
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                channelId: ChannelIdConfig.gupshup,
                memberId,
                memberName: message.payload.sender.name,
                memberPhone: convertPhoneNumber(message.payload.sender.phone),
                memberDDI: message?.payload?.sender?.country_code,
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    gupshupAppName: message.app,
                },
                channelConfig,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        if (startActivity) {
            startActivity.attachments = attachments;
            return await this.handleActivity(startActivity, message, channelConfigToken, conversation);
        } else {
            const activity = await this.gupshupUtilService.getActivityDto(message, conversation);
            activity.attachments = attachments;
            activity.quoted = quoted;
            return await this.handleActivity(activity, message, channelConfigToken, conversation);
        }
    }

    private async processMediaMessage(message: GupshupMessage, channelConfigToken: string) {
        try {
            this.activeMessageService.checkMissingResponse(message.payload.sender.phone, channelConfigToken);
            await this.gupshupUtilService.setGupshupIdHash(message.payload.id, message.payload.id);
            await this.awaiterDalay(message.payload.sender.phone, channelConfigToken);
            const instance = this.gupshupUtilService.getAxiosInstance();
            const response = await instance.get(encodeURI(message.payload.payload.url), {
                responseType: 'arraybuffer',
            });
            if (response.status > 300) {
                const bufferError = Buffer.from(response.data, 'binary');
                Sentry.captureEvent({
                    message: 'GupshupService.processMediaMessage response.status > 300',
                    extra: {
                        err: bufferError.toString(),
                    },
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Error gupshup', bufferError.toString());
                }
                return;
            }

            const getFileNameFromHeader = (name: string): string => {
                try {
                    return name
                        .split('=')[1]
                        .trim()
                        .replace(/^\"+|\"+$/g, '');
                } catch (e) {
                    return v4();
                }
            };
            const fileName = getFileNameFromHeader(response.headers['content-disposition'] as string);
            const fileExtension = response.headers['content-type'].split('/')[1];

            if (!fileExtension) {
                Sentry.captureEvent({
                    message: 'gupshup: invalid fileExtension',
                    extra: {
                        contentDisposition: response.headers['content-disposition'],
                        fileName,
                        fileExtension,
                    },
                });
            }

            const buffer = Buffer.from(response.data, 'binary');
            const fileToUpload: UploadingFile = {
                buffer,
                encoding: '',
                mimetype: response.headers['content-type'],
                size: buffer.byteLength,
                originalname: fileName,
                extension: fileExtension,
            };
            const quoted = await this.getQuoted(message);
            const memberId = this.gupshupUtilService.getMemberId(message);
            const referralSourceId = message?.payload?.referral?.source_id;

            let startActivity: ActivityDto;
            let messageText: string = this.getMessageText(message);

            let conversation;

            try {
                conversation = await this.getExistingConversation(channelConfigToken, memberId);
            } catch (e) {
                this.logger.error('processMediaMessage');
                console.error(e);
                Sentry.captureException(e);
            }

            if (!conversation) {
                conversation = await this.createConversationService.getExistingConversation(
                    channelConfigToken,
                    memberId,
                );
            }

            if (!conversation) {
                const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

                try {
                    // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                    if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                        return;
                    }
                } catch (error) {
                    console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
                }

                const r = await this.createConversationService.getConversation({
                    activityHash: message.payload.id,
                    activityText: messageText,
                    activityTimestamp: moment().valueOf(),
                    activityQuoted: quoted,
                    channelConfigToken,
                    channelId: !!referralSourceId ? ChannelIdConfig.ads : ChannelIdConfig.gupshup,
                    memberChannel: ChannelIdConfig.gupshup,
                    memberId,
                    memberName: message.payload.sender.name,
                    memberPhone: convertPhoneNumber(message.payload.sender.phone),
                    memberDDI: message?.payload?.sender?.country_code,
                    privateConversationData: {
                        phoneNumber: channelConfig?.configData?.phoneNumber,
                        apikey: channelConfig?.configData?.apikey,
                        gupshupAppName: message.app,
                    },
                    channelConfig,
                    referralSourceId: referralSourceId,
                });

                conversation = r.conversation;
                startActivity = r.startActivity;
            }

            if (!conversation) {
                return;
            }

            await this.createReferral(message, conversation);

            if (startActivity) {
                const attachment = await this.attachmentService.createAndUpload(
                    fileToUpload,
                    conversation._id,
                    getWithAndWithout9PhoneNumber(memberId),
                    true,
                );
                startActivity.referralSourceId = referralSourceId;
                startActivity.attachmentFile = {
                    contentType: attachment.mimeType,
                    contentUrl: attachment.attachmentLocation,
                    name: attachment.name,
                    key: attachment.key,
                    id: attachment.id || attachment._id,
                };
                startActivity.hash = message.payload.id;
                await this.handleActivity(startActivity, message, channelConfigToken, conversation);
            } else {
                await this.updateConversationWhatsappExpiration(conversation._id, message, channelConfigToken);
                await this.attachmentService.createAndUpload(
                    fileToUpload,
                    conversation._id,
                    getWithAndWithout9PhoneNumber(memberId),
                    false,
                    messageText,
                    null,
                    null,
                    message.payload.id || null,
                );
            }
        } catch (e) {
            console.log('GupshupService.processMediaMessage', e);
            try {
                let messageErr = e;
                if (e?.response?.data?.toString && typeof e?.response?.data?.toString == 'function') {
                    messageErr = e?.response?.data?.toString();
                }
                if (e?.toString && typeof e?.toString == 'function') {
                    messageErr = e?.toString?.();
                }
                Sentry.captureEvent({
                    message: 'GupshupService.processMediaMessage',
                    extra: {
                        error: messageErr,
                    },
                });
            } catch (e) {
                Sentry.captureEvent({
                    message: 'GupshupService.processMediaMessage catch 2',
                    extra: {
                        error: e,
                    },
                });
            }
        }
        // Quando for uma startActivity deve ser enviada depois do createAttachment pois senão o attachmente cai no fallback no engine
    }

    private getMessageText(message: GupshupMessage) {
        return message?.payload?.payload?.text || message?.payload?.payload?.caption || '';
    }

    private async getQuoted(message: GupshupMessage) {
        let quoted;
        if (message?.payload?.context || message?.payload?.payload?.gsId || message?.payload?.payload?.id) {
            const gsId =
                message?.payload?.context?.gsId || message?.payload?.payload?.gsId || message?.payload?.payload?.id;
            if (gsId) {
                const client = await this.cacheService.getClient();
                const key = this.gupshupUtilService.getActivtyGupshupIdHashCacheKey(gsId);
                const hash = await client.get(key);
                quoted = hash;
                if (!hash) {
                    quoted = await this.gupshupIdHashService.findHashByGsId(gsId);
                }
            }
            if (message?.payload?.context?.id && !gsId) {
                quoted = message?.payload?.context?.id;
            }
        }
        return quoted;
    }

    private async createReferral(message: GupshupMessage, conversation) {
        try {
            if (message?.payload?.referral) {
                const { headline, source_id, source_type, source_url, body, image, video } = message.payload.referral;
                if (source_id) {
                    await this.referralService.create({
                        conversationId: String(conversation._id),
                        sourceId: source_id,
                        sourceType: SourceTypeEnum?.[source_type] || SourceTypeEnum.ad,
                        sourceUrl: source_url,
                        workspaceId: String(conversation.workspace._id),
                        headline,
                        body,
                        imageId: image?.id,
                        videoId: video?.id,
                    });
                }
            }
        } catch (e) {
            this.logger.error('createReferral', e);
            Sentry.captureEvent({
                message: 'ERROR GupshupService: createReferral',
                extra: {
                    error: JSON.stringify(e),
                },
            });
        }
    }

    private async processTextMessage(message: GupshupMessage, channelConfigToken: string) {
        this.activeMessageService.checkMissingResponse(message.payload.sender.phone, channelConfigToken);
        await this.gupshupUtilService.setGupshupIdHash(message.payload.id, message.payload.id);
        await this.awaiterDalay(message.payload.sender.phone, channelConfigToken);
        const quoted = await this.getQuoted(message);
        const memberId = this.gupshupUtilService.getMemberId(message);
        const referralSourceId = message?.payload?.referral?.source_id;

        let startActivity: ActivityDto;
        let conversation;
        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processTextMessage');
            console.error(e);
            Sentry.captureException(e);
        }

        if (!conversation) {
            conversation = await this.createConversationService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.createConversationService.getConversation({
                activityHash: message.payload.id,
                activityText: message?.payload?.payload?.text || message?.payload?.payload?.emoji || '',
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                channelId: !!referralSourceId ? ChannelIdConfig.ads : ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: message.payload.sender.name,
                memberPhone: convertPhoneNumber(message.payload.sender.phone),
                memberDDI: message?.payload?.sender?.country_code,
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    gupshupAppName: message.app,
                },
                channelConfig,
                referralSourceId: referralSourceId,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        await this.createReferral(message, conversation);
        // try {
        //     await this.gupshupIdHashService.create({
        //         channelConfigToken,
        //         gsId: message.payload.id,
        //         hash: message.payload.id,
        //         conversationId: conversation._id,
        //         workspaceId: conversation.workspace?._id
        //     })
        // } catch (e) {

        // }

        if (startActivity) {
            startActivity.referralSourceId = referralSourceId;
            return await this.handleActivity(startActivity, message, channelConfigToken, conversation);
        } else {
            const activity = await this.gupshupUtilService.getActivityDto(message, conversation);
            activity.quoted = quoted;
            activity.referralSourceId = referralSourceId;
            return await this.handleActivity(activity, message, channelConfigToken, conversation);
        }
    }

    private async processReactionMessage(message: GupshupMessage, channelConfigToken: string) {
        this.activeMessageService.checkMissingResponse(message.payload.sender.phone, channelConfigToken);
        await this.gupshupUtilService.setGupshupIdHash(message.payload.id, message.payload.id);
        await this.awaiterDalay(message.payload.sender.phone, channelConfigToken);
        const quoted = await this.getQuoted(message);
        const memberId = this.gupshupUtilService.getMemberId(message);

        let startActivity: ActivityDto;
        let conversation;
        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processReactionMessage');
            console.error(e);
            Sentry.captureException(e);
        }

        if (!conversation) {
            conversation = await this.createConversationService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.createConversationService.getConversation({
                activityHash: message.payload.id,
                activityText: message?.payload?.payload?.emoji || '',
                activityTimestamp: moment().valueOf(),
                activityQuoted: null,
                channelConfigToken,
                channelId: ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: message.payload.sender.name,
                memberPhone: convertPhoneNumber(message.payload.sender.phone),
                memberDDI: message?.payload?.sender?.country_code,
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    gupshupAppName: message.app,
                },
                channelConfig,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        if (startActivity) {
            return await this.handleActivity(startActivity, message, channelConfigToken, conversation);
        } else {
            const activity = await this.gupshupUtilService.getActivityDto(message, conversation);
            activity.data = { ...(activity.data || {}), reactionHash: quoted };
            return await this.handleActivity(activity, message, channelConfigToken, conversation);
        }
    }
    private async processListMessage(message: GupshupMessage, channelConfigToken: string) {
        await this.gupshupUtilService.setGupshupIdHash(message.payload.id, message.payload.id);
        await this.awaiterDalay(message.payload.sender.phone, channelConfigToken);
        const quoted = await this.getQuoted(message);
        const memberId = this.gupshupUtilService.getMemberId(message);
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
        const referralSourceId = message?.payload?.referral?.source_id;

        const text =
            message.payload?.payload?.postbackText ||
            message.payload?.payload?.title ||
            message?.payload?.payload?.text;
        message.payload.payload.text = text;

        let startActivity: ActivityDto;
        let conversation;

        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processListMessage');
            console.error(e);
            Sentry.captureException(e);
        }

        if (!conversation) {
            conversation = await this.createConversationService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.createConversationService.getConversation({
                activityHash: message.payload.id,
                activityText: text,
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                channelId: !!referralSourceId ? ChannelIdConfig.ads : ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: message.payload.sender.name,
                memberPhone: convertPhoneNumber(message.payload.sender.phone),
                memberDDI: message?.payload?.sender?.country_code,
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    gupshupAppName: message.app,
                },
                referralSourceId: referralSourceId,
                channelConfig,
            });
            conversation = r.conversation;
            startActivity = r.startActivity;
        }
        if (!conversation) {
            return;
        }

        await this.createReferral(message, conversation);

        if (startActivity) {
            startActivity.referralSourceId = referralSourceId;
            return await this.handleActivity(startActivity, message, channelConfigToken, conversation);
        } else {
            const activity = await this.gupshupUtilService.getActivityDto(message, conversation);
            activity.quoted = quoted;
            activity.referralSourceId = referralSourceId;
            return await this.handleActivity(activity, message, channelConfigToken, conversation);
        }
    }

    private async handleActivity(
        activityRequest: ActivityDto,
        message: GupshupMessage,
        channelConfigToken: string,
        conversation?: Conversation,
    ) {
        // await this.updateConversationWhatsappExpiration(conversation._id, message, channelConfigToken);
        const whatsappExpiration = await this.updateConversationWhatsappExpiration(
            conversation._id,
            message,
            channelConfigToken,
        );
        if (whatsappExpiration > conversation.whatsappExpiration) {
            conversation.whatsappExpiration = whatsappExpiration;
        }

        try {
            if (
                !activityRequest?.text &&
                !activityRequest?.attachmentFile &&
                activityRequest.type == ActivityType.message &&
                !message?.payload?.payload?.contacts
            ) {
                Sentry.captureEvent({
                    message: 'DEBUG GupshupService: empty message',
                    extra: {
                        activityRequest: JSON.stringify(activityRequest),
                        payload1: JSON.stringify(message?.payload),
                        payload2: JSON.stringify(message?.payload?.payload),
                    },
                });
            }
        } catch (e) {
            Sentry.captureEvent({
                message: 'DEBUG GupshupService: empty message catch',
                extra: {
                    e,
                },
            });
        }

        return await this.activityService.handleActivity(
            activityRequest,
            castObjectIdToString(conversation._id),
            conversation,
            true,
        );
    }

    private async getExistingConversation(channelConfigToken: string, memberId: string) {
        let conversation;
        if (memberId.startsWith('55')) {
            const [option1, option2] = await this.gupshupUtilService.getAllPossibleBrIds(memberId);

            conversation = await this.createConversationService.getExistingConversation(channelConfigToken, option1);

            if (!conversation) {
                conversation = await this.createConversationService.getExistingConversation(
                    channelConfigToken,
                    option2,
                );
            }

            if (!conversation) {
                conversation = await this.conversationService.getConversationByMemberIdListAndChannelConfig(
                    [option1, option2],
                    channelConfigToken,
                );
            }
        } else {
            conversation = await this.createConversationService.getExistingConversation(channelConfigToken, memberId);
        }

        return conversation;
    }

    async updateConversationWhatsappExpiration(
        conversationId,
        message: GupshupMessage,
        channelConfigToken: string,
    ): Promise<number> {
        const timestamp = moment().add(24, 'hours').valueOf();
        await this.conversationService.updateWhatsappExpiration({
            conversationId,
            timestamp,
            phoneNumber: message.payload.sender.phone,
        } as IConversationWhatsappExpirationUpdated);
        await this.conversationService.updateConversationSessionCount(
            message.payload.sender.phone,
            conversationId,
            channelConfigToken,
        );
        return timestamp;
    }

    async updateConversationWhatsappSessionByAck(message: GupshupMessage, channelConfigToken: string) {
        const client = await this.cacheService.getClient();
        const key = this.gupshupUtilService.getActivtyGupshupIdHashCacheKey(message.payload.gsId);
        const hash = await client.get(key);
        const activity = await this.activityService.getOneByHash(hash);
        if (activity && activity.isHsm) {
            await this.conversationService.updateConversationSessionCount(
                message.payload.destination,
                activity.conversationId,
                channelConfigToken,
            );
        }
    }

    async updateActivityAck(gsId: string, ack: number, channelConfigToken: string, body?: any, workspaceId?: string) {
        const timer = ackProcessLatencyLocation.labels('loc1').startTimer();
        const client = await this.cacheService.getClient();
        const key = this.gupshupUtilService.getActivtyGupshupIdHashCacheKey(gsId);
        let hash = await client.get(key);
        timer();

        const timer2 = ackProcessLatencyLocation.labels('loc2').startTimer();
        if (!hash) {
            await new Promise((r) => setTimeout(r, 1000));
            hash = await client.get(key);
            if (!hash) {
                hash = await this.gupshupIdHashService.findHashByGsId(gsId);
                if (!hash) {
                    // console.log('Not found hash on postgres', gsId, ack, JSON.stringify(body || {}));
                    return;
                }
            }
        }
        timer2();

        const timer3 = ackProcessLatencyLocation.labels('loc3').startTimer();
        if (ack === AckType.Read) {
            await client.expire(key, 100);
        }
        timer3();
        //Todo publish to kafka

        const timer4 = ackProcessLatencyLocation.labels('loc4').startTimer();
        let conversation;
        if (ack === AckType.ServerAck) {
            const conversationId = await this.activityService.getConversationIdByActivityHash(hash);
            if (conversationId) {
                conversation = await this.conversationService.getOne(conversationId);
                if (!!conversation && !conversation?.deliveredMessage) {
                    await this.conversationService.updateDeliveredMessageInConversation(conversationId);
                }
            }
        }
        timer4();

        const timer5 = ackProcessLatencyLocation.labels('loc5').startTimer();
        const data = {
            data: {
                ack,
                hash: [hash],
                timestamp: moment().format().valueOf(),
                workspaceId,
                conversation: conversation,
            } as IActivityAck & { conversation: any },
            dataType: KissbotEventDataType.WHATSWEB_MESSAGE_ACK,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WHATSWEB_MESSAGE_ACK,
        };

        // this.eventsService.sendEvent(data);

        this.kafkaService.sendEvent(data, channelConfigToken, 'activity_ack');
        timer5();
        return hash;
    }

    async handleIncomingTemplateEvent(payload: GupshupMessage, channelConfigToken: string, workspaceId?: string) {}
}
