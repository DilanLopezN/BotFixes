import { Injectable } from '@nestjs/common';
import { CacheService } from './../../../../../_core/cache/cache.service';
import axios, { AxiosInstance } from 'axios';
import {
    InteractiveType,
    PayloadAudioMessage,
    PayloadDocumentMessage,
    PayloadGupshupTypes,
    PayloadImageMessage,
    PayloadInteractiveFlowMessage,
    PayloadInteractiveMessage,
    PayloadInteractiveReactionMessage,
    PayloadTemplateMessage,
    PayloadTextMessage,
    PayloadVideoMessage,
} from '../interfaces/payload-message-gupshup-v3.interface';
const axiosRetry = require('axios-retry');
import { Activity } from '../../../../../activity/interfaces/activity';
import { ExternalDataService } from './external-data.service';
import { ActivityType, getWithAndWithout9PhoneNumber, GupshupWhatsappWebhookEvent, IdentityType } from 'kissbot-core';
import { Conversation, Identity } from './../../../../../conversation/interfaces/conversation.interface';
import { ActivityDto } from '../../../../../conversation/dto/activities.dto';
import * as moment from 'moment';
import { CompleteChannelConfig } from '../../../../../channel-config/channel-config.service';

@Injectable()
export class GupshupV3UtilService {
    constructor(public cacheService: CacheService, private readonly externalDataService: ExternalDataService) {}

    getAxiosInstance(): AxiosInstance {
        const instance = axios.create({
            timeout: 10 * 3000,
            baseURL: 'https://partner.gupshup.io/partner',
        });

        axiosRetry(instance, {
            retries: 2,
            retryCondition: (err) => {
                return true;
            },
            retryDelay: () => 500,
        });
        return instance;
    }

    async transformActivityToPayloadGupshup(activity: Activity, payloadType: PayloadGupshupTypes) {
        const { caption, fileName, mediaUrl } = await this.getMediaInfo(activity, payloadType);
        let payload;
        switch (payloadType) {
            case PayloadGupshupTypes.PayloadTextMessage:
                payload = {
                    body: activity.text,
                } as PayloadTextMessage;
                break;
            case PayloadGupshupTypes.PayloadAudioMessage:
                payload = {
                    id: '',
                } as PayloadAudioMessage;
                break;
            case PayloadGupshupTypes.PayloadImageMessage:
                payload = {
                    id: '',
                    caption: caption,
                    link: mediaUrl,
                } as PayloadImageMessage;
                break;
            case PayloadGupshupTypes.PayloadVideoMessage:
                payload = {
                    id: '',
                    caption: caption,
                    link: mediaUrl,
                } as PayloadVideoMessage;
                break;
            case PayloadGupshupTypes.PayloadDocumentMessage:
                payload = {
                    id: '',
                    caption: caption,
                    link: mediaUrl,
                } as PayloadDocumentMessage;
                break;
            case PayloadGupshupTypes.PayloadInteractiveReactionMessage:
                payload = {
                    emoji: activity.text,
                    message_id: activity.quoted,
                } as PayloadInteractiveReactionMessage;
                break;
            case PayloadGupshupTypes.PayloadInteractiveMessage:
                payload = {
                    action: {
                        buttons: [],
                    },
                    header: {
                        type: '',
                    },
                    body: {
                        text: activity.text,
                    },
                    footer: {
                        text: '',
                    },
                    type: InteractiveType.button,
                } as PayloadInteractiveMessage;
                break;
            case PayloadGupshupTypes.PayloadInteractiveFlowMessage:
                const attach = activity.attachments?.[0];
                const button = attach.content.buttons[0];
                const flowData = await this.externalDataService.getFlowDataWithFlow(button.value);

                payload = {
                    action: {
                        name: 'flow',
                        parameters: {
                            flow_action: 'navigate',
                            flow_cta: button?.title || 'Clique aqui!',
                            flow_id: flowData?.flow?.flowId,
                            flow_token: flowData?.flow?.id ? `${flowData.flow.id}` : undefined,
                            flow_message_version: '3',
                            flow_action_payload: {
                                screen: flowData.flowScreen || 'RECOMMEND',
                                data: Object.keys(flowData?.data || {}).length ? flowData.data : undefined,
                            },
                        },
                    },
                    header: attach?.content?.title
                        ? {
                              type: 'text',
                              text: attach?.content?.title,
                          }
                        : undefined,
                    body: {
                        text: `${attach.content?.subtitle ? `${attach.content?.subtitle}\n` : ''}${
                            attach.content?.text ? attach.content?.text : ''
                        }`,
                    },
                    footer: undefined,
                    type: InteractiveType.flow,
                } as PayloadInteractiveFlowMessage;
                break;
            case PayloadGupshupTypes.PayloadTemplateMessage:
                payload = {
                    language: {
                        code: 'pt',
                        name: '',
                        namespace: '',
                        policy: 'deterministic',
                    },
                    components: [],
                } as PayloadTemplateMessage;
                break;
        }

        return payload;
    }

    private async getMediaInfo(activity: Activity, payloadType: PayloadGupshupTypes) {
        if (
            payloadType !== PayloadGupshupTypes.PayloadAudioMessage &&
            payloadType !== PayloadGupshupTypes.PayloadImageMessage &&
            payloadType !== PayloadGupshupTypes.PayloadVideoMessage &&
            payloadType !== PayloadGupshupTypes.PayloadDocumentMessage
        ) {
            return { mediaUrl: '', fileName: '', caption: '' };
        }
        let mediaUrl: string = activity.attachmentFile.contentUrl;

        const fileName = activity.attachmentFile.name || activity.attachmentFile.key;
        const caption = activity?.text || '';

        if (!mediaUrl || mediaUrl.startsWith(process.env.API_URI)) {
            mediaUrl = await this.externalDataService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });
            mediaUrl = mediaUrl.substring(0, mediaUrl.lastIndexOf('?'));
        }

        return { mediaUrl, fileName, caption };
    }

    getActivtyGupshupIdHashCacheKey(id: string) {
        return `GSID:${id}`;
    }

    getActivtyHashGupshupIdCacheKey(id: string) {
        return `AHASH:${id}`;
    }

    async setGupshupIdHash(id: string, hash: string) {
        const client = await this.cacheService.getClient();
        let key = this.getActivtyGupshupIdHashCacheKey(id);
        await client.set(key, hash, 'EX', 86400);
    }

    getMemberId(payload: GupshupWhatsappWebhookEvent): string {
        return payload.entry[0].changes[0].value.contacts[0].wa_id;
    }

    getMemberName(payload: GupshupWhatsappWebhookEvent): string {
        return payload.entry[0].changes[0].value.contacts[0].profile.name;
    }

    getHash(payload: GupshupWhatsappWebhookEvent) {
        return payload.entry[0].changes[0].value.messages[0].id;
    }

    getText(payload: GupshupWhatsappWebhookEvent) {
        return payload.entry[0].changes[0].value.messages[0]?.['text']?.body || '';
    }

    getContext(payload: GupshupWhatsappWebhookEvent) {
        return (
            payload.entry[0].changes[0].value.messages[0]?.context?.gs_id ||
            payload.entry[0].changes[0].value.messages[0]?.context?.meta_msg_id
        );
    }

    async getAllPossibleBrIds(memberId: string): Promise<string[]> {
        let mismatch = await this.externalDataService.getMismatchWaidAndPhoneNumber(memberId);
        let option1 = mismatch?.phoneNumber;
        let option2 = mismatch?.waid;
        if (!option1 || !option2) {
            return getWithAndWithout9PhoneNumber(memberId);
        }

        return [option1, option2];
    }

    async getActivityDto(payload: GupshupWhatsappWebhookEvent, conversation: Conversation) {
        const possibilities = await this.getAllPossibleBrIds(this.getMemberId(payload));
        const from: Identity = conversation.members.find((member) => possibilities.includes(member.id));
        const to: Identity = conversation.members.find((member) => member.type == IdentityType.bot);
        const activity: ActivityDto = {
            from,
            type: ActivityType.message,
            to,
            hash: this.getHash(payload),
            text: this.getText(payload),
        };

        activity.timestamp = moment().valueOf();

        const contextId = this.getContext(payload);
        if (contextId) {
            activity.quoted = contextId;
        }

        if (payload.entry[0].changes[0].value?.messages?.[0]?.type === 'reaction') {
            activity.data = {
                reactionHash: contextId,
            };
        }

        return activity;
    }

    getChannelData(channelConfig: CompleteChannelConfig) {
        return {
            channelToken: channelConfig.token,
            apikey: channelConfig.configData.apiKey,
            appId: channelConfig.configData.appId,
            phoneNumber: channelConfig.configData.phone,
            partnerToken: channelConfig.configData.token,
            gupshupAppName: channelConfig.configData.appName,
        };
    }
}
