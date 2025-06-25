import { Injectable } from '@nestjs/common';
import { CacheService } from './../../../../../_core/cache/cache.service';
import axios, { AxiosInstance } from 'axios';
const axiosRetry = require('axios-retry');
import { Activity } from '../../../../../activity/interfaces/activity';
import { ExternalDataService } from './external-data.service';
import { ActivityType, getWithAndWithout9PhoneNumber, IdentityType, MetaWhatsappWebhookEvent } from 'kissbot-core';
import { Conversation, Identity } from './../../../../../conversation/interfaces/conversation.interface';
import { ActivityDto } from '../../../../../conversation/dto/activities.dto';
import * as moment from 'moment';
import { MetaWhatsappOutcomingMessageType } from '../interfaces/meta-whatsapp-outcoming.interface';
import { CompleteChannelConfig } from '../../../../../channel-config/channel-config.service';

@Injectable()
export class Dialog360UtilService {
    constructor(public cacheService: CacheService, private readonly externalDataService: ExternalDataService) {}

    getAxiosInstance(): AxiosInstance {
        const instance = axios.create({
            timeout: 10 * 3000,
            baseURL: 'https://waba-v2.360dialog.io',
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

    private async getMediaInfo(activity: Activity, payloadType: MetaWhatsappOutcomingMessageType) {
        if (
            payloadType !== MetaWhatsappOutcomingMessageType.AUDIO &&
            payloadType !== MetaWhatsappOutcomingMessageType.IMAGE &&
            payloadType !== MetaWhatsappOutcomingMessageType.VIDEO &&
            payloadType !== MetaWhatsappOutcomingMessageType.DOCUMENT
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

    getActivtyDialog360IdHashCacheKey(id: string) {
        return `WPPID:${id}`;
    }

    getActivtyHashDialog360IdCacheKey(id: string) {
        return `AHASH:${id}`;
    }

    async setDialog360IdHash(id: string, hash: string) {
        const client = await this.cacheService.getClient();
        let key = this.getActivtyDialog360IdHashCacheKey(id);
        await client.set(key, hash, 'EX', 86400);
    }

    getMemberId(payload: MetaWhatsappWebhookEvent): string {
        return payload.entry[0].changes[0].value.contacts[0].wa_id;
    }

    getMemberName(payload: MetaWhatsappWebhookEvent): string {
        return payload.entry[0].changes[0].value.contacts[0].profile.name;
    }

    getHash(payload: MetaWhatsappWebhookEvent) {
        return payload.entry[0].changes[0].value.messages[0].id;
    }

    getText(payload: MetaWhatsappWebhookEvent) {
        return (
            payload.entry[0].changes[0].value.messages[0]?.['text']?.body ||
            payload.entry[0].changes[0].value.messages[0]?.['reaction']?.emoji ||
            payload.entry[0].changes[0].value.messages[0]?.interactive?.['button_reply']?.title ||
            payload.entry[0].changes[0].value.messages[0]?.interactive?.['list_reply']?.title ||
            payload.entry[0].changes[0].value.messages[0]?.['image']?.caption ||
            payload.entry[0].changes[0].value.messages[0]?.['video']?.caption ||
            payload.entry[0].changes[0].value.messages[0]?.['document']?.filename ||
            payload.entry[0].changes[0].value.messages[0]?.['contacts']?.name ||
            ''
        );
    }

    getContext(payload: MetaWhatsappWebhookEvent) {
        return (
            payload.entry[0].changes[0].value.messages[0]?.id ||
            payload.entry[0].changes[0].value.messages[0]?.context?.id
        );
    }

    async getAllPossibleBrIds(memberId: string): Promise<string[]> {
        return getWithAndWithout9PhoneNumber(memberId);
    }

    async getActivityDto(payload: MetaWhatsappWebhookEvent, conversation: Conversation) {
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

    async getFileDetails(activity: Activity) {
        if (!activity?.attachmentFile) {
            return { mediaUrl: null, fileType: null, fileName: null };
        }

        let mediaUrl: string = activity?.attachmentFile?.contentUrl;

        const fileName = activity?.attachmentFile?.name || activity?.attachmentFile?.key;

        if (!mediaUrl || mediaUrl.startsWith(process.env.API_URI)) {
            mediaUrl = await this.externalDataService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });
            mediaUrl = mediaUrl.substring(0, mediaUrl.lastIndexOf('?'));
        }
        let d360TemplateType;

        if (activity.attachmentFile.contentType.startsWith('image')) {
            d360TemplateType = 'image';
        } else if (activity.attachmentFile.contentType.startsWith('video')) {
            d360TemplateType = 'video';
        } else {
            d360TemplateType = 'file';
        }

        return { mediaUrl, fileType: d360TemplateType, fileName };
    }

    getChannelData(channelConfig: CompleteChannelConfig) {
        return {
            channelToken: channelConfig.token,
            apikey: channelConfig.configData.apiKey,
            appId: channelConfig.configData.appId,
            phoneNumber: channelConfig.configData.phone,
            partnerToken: channelConfig.configData.token,
            gupshupAppName: channelConfig.configData.appName,
            d360ApiKey: channelConfig.configData.d360ApiKey,
        };
    }

    convertContactToAttachment(contact: any) {
        return {
            contentType: 'application/contact',
            content: contact,
        };
    }
}
