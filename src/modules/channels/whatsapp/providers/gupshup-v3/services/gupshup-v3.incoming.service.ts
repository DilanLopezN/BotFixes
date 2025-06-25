import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import * as moment from 'moment';
import {
    IConversationWhatsappExpirationUpdated,
    ActivityType,
    GupshupWhatsappWebhookEvent,
    convertPhoneNumber,
    ChannelIdConfig,
} from 'kissbot-core';
import { ActivityDto, Attachment } from './../../../../../conversation/dto/activities.dto';
import { Conversation } from './../../../../../conversation/interfaces/conversation.interface';
import { EventsService } from './../../../../../events/events.service';
import { castObjectIdToString } from '../../../../../../common/utils/utils';
import { ExternalDataService } from './external-data.service';
import { CacheService } from '../../../../../_core/cache/cache.service';
import { GupshupV3UtilService } from './gupshup-util.service';
import { Flow } from '../../../../../whatsapp-flow/models/flow.entity';

@Injectable()
export class GupshupV3IncomingService {
    private readonly logger = new Logger(GupshupV3IncomingService.name);

    constructor(
        private readonly cacheService: CacheService,
        private readonly externalDataService: ExternalDataService,
        private readonly gupshupV3UtilService: GupshupV3UtilService,
        public readonly eventsService: EventsService,
    ) {}

    async handleWhatsappMessage(
        payload: GupshupWhatsappWebhookEvent,
        channelConfigToken: string,
        workspaceId?: string,
    ) {
        let result = null;
        try {
            if (
                payload?.entry?.[0]?.changes?.[0]?.field === 'messages' &&
                !!payload.entry[0].changes[0]?.value?.messages?.[0]
            ) {
                try {
                    const existActivity = await this.externalDataService.existsActivityByHash(
                        payload.entry[0].changes[0].value.messages[0].id,
                    );
                    if (existActivity) {
                        this.logger.warn('duplicate activity', JSON.stringify(payload));
                        return;
                    }
                } catch (e) {
                    console.log('quebrou handleWhatsappMessage', e);
                }

                switch (payload.entry[0].changes[0].value.messages[0].type) {
                    case 'interactive': {
                        result = await this.processInteractiveMessage(payload, channelConfigToken);
                        break;
                    }
                    default: {
                        console.log('GUPSHUP-V3 message nao tratada', JSON.stringify(payload));
                    }
                }
            } else {
                console.log('GUPSHUP-V3 handleWhatsappMessage nao tratada', JSON.stringify(payload));
            }

            return result;
        } catch (e) {
            console.log(e);

            Sentry.captureException(e);

            throw e;
        }
    }

    private async processInteractiveMessage(payload: GupshupWhatsappWebhookEvent, channelConfigToken: string) {
        if (payload.entry[0].changes[0].value.messages[0].interactive?.nfm_reply?.name !== 'flow') {
            return;
        }

        const memberId = this.gupshupV3UtilService.getMemberId(payload);
        const memberName = this.gupshupV3UtilService.getMemberName(payload);

        let responseFlow = {};
        let flow: Flow;
        try {
            responseFlow = JSON.parse(
                payload.entry[0].changes[0].value.messages[0].interactive?.nfm_reply?.response_json,
            );
        } catch (e) {
            console.log('Error processInteractiveMessage parse JSON: ', JSON.stringify(e));
            return null;
        }

        if (responseFlow?.['flow_token'] !== 'unused') {
            flow = await this.externalDataService.getFlowById(responseFlow['flow_token']);
        }

        if (!flow) {
            console.log('Error not found Flow: ', JSON.stringify(payload));
            return null;
        }

        this.externalDataService.checkMissingResponse(memberId, channelConfigToken);
        const hash = this.gupshupV3UtilService.getHash(payload);
        await this.gupshupV3UtilService.setGupshupIdHash(hash, hash);
        await this.awaiterDalay(memberId, channelConfigToken);
        const quoted = await this.getQuoted(payload);

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
            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: this.gupshupV3UtilService.getText(payload),
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                channelId: ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: memberName,
                memberPhone: convertPhoneNumber(memberId),
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    gupshupAppName: channelConfig.configData.appName,
                },
                channelConfig,
                referralSourceId: null,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        if (startActivity) {
            return await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
        } else {
            const activity = await this.gupshupV3UtilService.getActivityDto(payload, conversation);
            activity.quoted = quoted;

            let contentFlow: any = {};
            if (flow?.flowFields) {
                const pages = flow.flowFields?.pages?.map((page) => {
                    const fields = page?.fields?.map((field) => {
                        if (responseFlow?.[field?.name]) {
                            const value = responseFlow[field.name];
                            return {
                                ...field,
                                value,
                            };
                        }
                        return field;
                    });
                    return {
                        ...page,
                        fields,
                    };
                });
                contentFlow = {
                    ...flow.flowFields,
                    pages,
                };
            }

            const attachment: Attachment = {
                contentType: 'flow_response',
                content: contentFlow,
            };
            activity.attachments = [attachment];

            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async getQuoted(payload: GupshupWhatsappWebhookEvent) {
        let quoted;
        if (payload?.entry[0].changes[0].value.messages?.[0]?.context) {
            const gsId = payload?.entry[0].changes[0].value.messages[0].context.gs_id;

            if (gsId) {
                const client = await this.cacheService.getClient();
                const key = this.gupshupV3UtilService.getActivtyGupshupIdHashCacheKey(gsId);
                const hash = await client.get(key);
                quoted = hash;
                if (!hash) {
                    quoted = await this.externalDataService.findHashByGsId(gsId);
                }
            }
            if (payload?.entry[0].changes[0].value.messages[0].context.meta_msg_id && !gsId) {
                quoted = payload?.entry[0].changes[0].value.messages[0].context.meta_msg_id;
            }
        }
        return quoted;
    }

    private async awaiterDalay(phoneNumber: string, channelConfigToken: string) {
        const secondsToWait = await this.cacheService.incr(`${phoneNumber}:${channelConfigToken}`, 10);
        await new Promise((r) => setTimeout(r, (secondsToWait - 1) * 500));
    }

    private async getExistingConversation(channelConfigToken: string, memberId: string) {
        let conversation;
        if (memberId.startsWith('55')) {
            const [option1, option2] = await this.gupshupV3UtilService.getAllPossibleBrIds(memberId);

            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, option1);

            if (!conversation) {
                conversation = await this.externalDataService.getExistingConversation(channelConfigToken, option2);
            }

            if (!conversation) {
                conversation = await this.externalDataService.getConversationByMemberIdListAndChannelConfig(
                    [option1, option2],
                    channelConfigToken,
                );
            }
        } else {
            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
        }

        return conversation;
    }

    private async handleActivity(
        activityRequest: ActivityDto,
        payload: GupshupWhatsappWebhookEvent,
        channelConfigToken: string,
        conversation?: Conversation,
    ) {
        const whatsappExpiration = await this.updateConversationWhatsappExpiration(
            conversation._id,
            payload.entry[0].changes[0].value.messages[0].from,
            channelConfigToken,
        );
        if (whatsappExpiration > conversation.whatsappExpiration) {
            conversation.whatsappExpiration = whatsappExpiration;
        }

        try {
            if (
                !activityRequest?.text &&
                !activityRequest?.attachmentFile &&
                activityRequest.type == ActivityType.message
            ) {
                Sentry.captureEvent({
                    message: 'DEBUG GupshupV3IncomingService: empty message',
                    extra: {
                        activityRequest: JSON.stringify(activityRequest),
                        payload: JSON.stringify(payload),
                    },
                });
            }
        } catch (e) {
            Sentry.captureEvent({
                message: 'DEBUG GupshupV3IncomingService: empty message catch',
                extra: {
                    e,
                },
            });
        }

        return await this.externalDataService.handleActivity(
            activityRequest,
            castObjectIdToString(conversation._id),
            conversation,
            true,
        );
    }

    async updateConversationWhatsappExpiration(
        conversationId,
        phoneNumber: string,
        channelConfigToken: string,
    ): Promise<number> {
        const timestamp = moment().add(24, 'hours').valueOf();
        await this.externalDataService.updateWhatsappExpiration({
            conversationId,
            timestamp,
            phoneNumber: phoneNumber,
        } as IConversationWhatsappExpirationUpdated);
        await this.externalDataService.updateConversationSessionCount(phoneNumber, conversationId, channelConfigToken);
        return timestamp;
    }
}
