import { Injectable } from '@nestjs/common';
import { CreateConversationService } from './../../../conversation/services/create-conversation.service';
import { ChannelConfigService } from './../../../channel-config/channel-config.service';
import * as moment from 'moment';
import { FacebookApiService } from './facebook-api.service';
import { CatchError, Exceptions } from './../../../auth/exceptions';
import {
    AckType,
    ActivityType,
    ChannelIdConfig,
    IActivityAck,
    IdentityType,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
} from 'kissbot-core';
import { ActivityService } from './../../../activity/services/activity.service';
import { Conversation, Identity } from './../../../conversation/interfaces/conversation.interface';
import { ActivityDto } from './../../../conversation/dto/activities.dto';
import { ConversationService } from './../../../conversation/services/conversation.service';
import { EventsService } from './../../../events/events.service';
import { CacheService } from './../../../_core/cache/cache.service';
import axios, { AxiosInstance } from 'axios';
import { v4 } from 'uuid';
import { AttachmentService } from './../../../attachment/services/attachment.service';
import { UploadingFile } from '../../../../common/interfaces/uploading-file.interface';
import { castObjectIdToString } from '../../../../common/utils/utils';

const axiosRetry = require('axios-retry');
interface FacebookIncoming {
    type: ChannelIdConfig.facebook | ChannelIdConfig.instagram;
    sender: {
        id: string;
    };
    recipient: {
        id: string;
    };
    timestamp: number;
    delivery?: {
        mids?: string[];
        watermark: number;
    };
    read?: {
        watermark: number;
    };
    message?: {
        is_echo?: boolean;
        mid: string;
        text?: string;
        quick_reply?: {
            payload: string;
        };
        reply_to?: {
            mid: string;
        };
        attachments?: [
            {
                type: 'image' | 'video' | 'audio' | 'file';
                payload: {
                    url: string;
                    title?: string;
                    sticker_id?: string;
                    coordinates?: {
                        lat: number;
                        long: number;
                    };
                };
            },
        ];
    };
}

@Injectable()
export class IncomingService {
    constructor(
        private readonly channelConfigService: ChannelConfigService,
        private readonly createConversationService: CreateConversationService,
        private readonly facebookApiService: FacebookApiService,
        private readonly activityService: ActivityService,
        private readonly conversationService: ConversationService,
        public readonly eventsService: EventsService,
        public cacheService: CacheService,
        private readonly attachmentService: AttachmentService,
    ) {}

    async handleIncomingMessage(body: FacebookIncoming) {
        const channelConfigToken = body.recipient.id;

        // No instagram sabemos que a mensagem foi entregue quando eles nos mandam a mensagem de volta com o parametro is_echo = true
        if (body.message?.is_echo && body.type === ChannelIdConfig.instagram) {
            await this.handleAck(body.timestamp, this.getMemberId(body), AckType.DeliveryAck, channelConfigToken);
            return;
        }

        if (body.message?.attachments?.length > 0) {
            await this.processMediaMessage(body, channelConfigToken);
        }
        if (body.message?.text) {
            await this.handleTextMessage(body, channelConfigToken);
        }
        if (body.delivery) {
            await this.handleAck(
                body.delivery.watermark,
                this.getMemberId(body),
                AckType.DeliveryAck,
                channelConfigToken,
            );
        }
        if (body.read) {
            // quando a mensagem foi lida pelo facebook retorna um read.watermark, quando é pelo insta retorna apenas o timestamp
            const timestamp = body.read.watermark || body.timestamp;
            await this.handleAck(timestamp, this.getMemberId(body), AckType.Read, channelConfigToken);
        }
    }

    @CatchError()
    private async getChannelIdFromIncoming(body: FacebookIncoming): Promise<ChannelIdConfig> {
        if (body.type === 'instagram') {
            return ChannelIdConfig.instagram;
        }
        return ChannelIdConfig.facebook;
    }

    @CatchError()
    private async handleTextMessage(body: FacebookIncoming, channelConfigToken: string) {
        const quoted = await this.getQuoted(body);
        const memberId = this.getMemberId(body);
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
        if (channelConfig.channelId !== body.type) {
            throw Exceptions.FACEBOOK_CHANNEL_MISMATCH;
        }
        const profile = await this.facebookApiService.getProfile(
            body.sender.id,
            channelConfig.configData.facebookApiToken,
        );
        const { conversation, startActivity } = await this.createConversationService.getConversation({
            activityHash: body.message.mid,
            activityText: body.message?.text || '',
            activityTimestamp: moment().valueOf(),
            activityQuoted: quoted,
            channelConfigToken,
            channelId: await this.getChannelIdFromIncoming(body),
            memberId,
            memberName: `${profile.name || `${profile.first_name} ${profile.last_name}`}`,
            memberAvatar: profile.profile_pic,
            privateConversationData: {
                facebookApiToken: channelConfig.configData.facebookApiToken,
            },
        });
        if (!conversation) {
            return;
        }

        if (startActivity) {
            return await this.activityService.handleActivity(
                startActivity,
                castObjectIdToString(conversation._id),
                conversation,
            );
        } else {
            const activity = this.getActivityDto(body, conversation);
            activity.quoted = quoted;
            return await this.activityService.handleActivity(
                activity,
                castObjectIdToString(conversation._id),
                conversation,
            );
        }
    }

    async handleAck(watermark: number, memberId: string, ack: AckType, channelConfigToken: string) {
        const conversation = await this.conversationService.getConversationByMemberIdAndChannelConfig(
            memberId,
            channelConfigToken,
        );
        if (!conversation) {
            return;
        }
        const cacheKey = `FB_ACK:${conversation._id}`;

        const activitiesHashes = await this.activityService.getActivitiesHashesByConversationIdAndWatermark(
            castObjectIdToString(conversation._id),
            watermark,
        );

        const client = this.cacheService.getClient();

        const hashes = [];

        for (const ac of activitiesHashes) {
            let savedAck: any = await client.hget(cacheKey, ac.hash);
            savedAck = parseInt(savedAck);
            if (isNaN(savedAck) || savedAck < ack) {
                hashes.push(ac.hash);
                await client.hset(cacheKey, ac.hash, ack);
                await client.expire(cacheKey, 86400);
            }
        }

        if (hashes.length === 0) return;

        this.eventsService.sendEvent({
            data: {
                ack,
                hash: hashes,
                timestamp: moment().format().valueOf(),
            } as IActivityAck,
            dataType: KissbotEventDataType.WHATSWEB_MESSAGE_ACK,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WHATSWEB_MESSAGE_ACK,
        });
    }

    private async getQuoted(body: FacebookIncoming) {
        if (body.message?.reply_to?.mid) {
            return body.message?.reply_to?.mid;
        }
        return null;
    }

    private getMemberId(body: FacebookIncoming): string {
        return `${body.sender.id}`;
    }

    getActivityDto(message: FacebookIncoming, conversation: Conversation) {
        const from: Identity = conversation.members.find((member) => member.id == this.getMemberId(message));
        const to: Identity = conversation.members.find((member) => member.type == IdentityType.bot);
        const activity: ActivityDto = {
            from,
            type: ActivityType.message,
            to,
            hash: message.message.mid,
            text: message?.message?.text || '',
        };

        activity.timestamp = moment().valueOf();

        if (message.message?.reply_to?.mid) {
            activity.quoted = message.message?.reply_to?.mid;
        }

        return activity;
    }

    private async processMediaMessage(message: FacebookIncoming, channelConfigToken: string) {
        try {
            const instance = this.getAxiosInstance();
            const response = await instance.get(message.message?.attachments?.[0].payload.url, {
                responseType: 'arraybuffer',
            });
            if (response.status > 300) {
                const bufferError = Buffer.from(response.data, 'binary');
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
            const memberId = this.getMemberId(message);
            const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
            if (channelConfig.channelId !== message.type) {
                throw Exceptions.FACEBOOK_CHANNEL_MISMATCH;
            }
            const profile = await this.facebookApiService.getProfile(
                message.sender.id,
                channelConfig.configData.facebookApiToken,
            );
            const { conversation, startActivity } = await this.createConversationService.getConversation({
                activityHash: message.message.mid,
                activityText: message.message?.text || '',
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                channelId: await this.getChannelIdFromIncoming(message),
                memberId,
                memberName: `${profile.first_name} ${profile.last_name}`,
                privateConversationData: {
                    facebookApiToken: channelConfig.configData.facebookApiToken,
                },
            });
            if (!conversation) {
                return;
            }
            if (startActivity) {
                const attachment = await this.attachmentService.createAndUpload(
                    fileToUpload,
                    castObjectIdToString(conversation._id),
                    memberId,
                    true,
                );
                startActivity.attachmentFile = {
                    contentType: attachment.mimeType,
                    contentUrl: attachment.attachmentLocation,
                    name: attachment.name,
                    key: attachment.key,
                    id: attachment.id || attachment._id,
                };
                await this.activityService.handleActivity(startActivity, castObjectIdToString(conversation._id));
            } else {
                await this.attachmentService.createAndUpload(
                    fileToUpload,
                    castObjectIdToString(conversation._id),
                    memberId,
                    false,
                );
            }
        } catch (e) {
            console.log('IncomingService.processMediaMessage', e);
        }
    }

    getAxiosInstance(): AxiosInstance {
        const instance = axios.create({
            timeout: 10 * 1000,
        });

        axiosRetry(instance, {
            retries: 2,
            retryCondition: (err) => {
                return err?.response?.status >= 400;
            },
            retryDelay: () => 500,
        });
        return instance;
    }
}
