import { Injectable } from '@nestjs/common';
import { ActivityType, ChannelIdConfig, ConversationStatus, IdentityType } from 'kissbot-core';
import axios from 'axios';
import * as moment from 'moment';
import * as uuid from 'uuid';
import * as fileTypeLib from 'file-type';
import { CacheService } from './../../../_core/cache/cache.service';
import { ConversationService } from './../../../conversation/services/conversation.service';
import { ActivityService } from './../../../activity/services/activity.service';
import { AttachmentService } from './../../../attachment/services/attachment.service';
import { PrivateConversationDataService } from './../../../private-conversation-data/services/private-conversation-data.service';
import { FileToUpload } from './../../../../common/file-uploader/interfaces/file-to-upload.interface';
import { Conversation, Identity } from './../../../../modules/conversation/interfaces/conversation.interface';
import { ActivityDto } from './../../../conversation/dto/activities.dto';
import { CreateConversationService } from './../../../conversation/services/create-conversation.service';
import { ChannelConfigService } from './../../../channel-config/channel-config.service';
import { isArray } from 'lodash';
import { castObjectIdToString } from '../../../../common/utils/utils';

interface TelegramChat {
    id: number;
    first_name: string;
    last_name: string;
    type: string;
}

interface TelegramFrom {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name: string;
    language_code: string;
}

interface TelegramDocument {
    file_name: string;
    mime_type: string;
    thumb: {
        file_id: string;
        file_unique_id: string;
        file_size: number;
        width: number;
        height: number;
    };
    file_id: string;
    file_unique_id: string;
    file_size: number;
}

interface TelegramVoice {
    duration: number;
    mime_type: string;
    file_id: string;
    file_unique_id: string;
    file_size: number;
}

interface TelegramPhoto {
    file_id: string;
    file_unique_id: string;
    file_size: number;
    width: number;
    mime_type: string;
    height: number;
}

interface TelegramMessage {
    message_id: number;
    from: TelegramFrom;
    chat: TelegramChat;
    date: number;
    reply_to_message?: TelegramMessage;
    text?: string;
    document?: TelegramDocument;
    voice?: TelegramVoice;
    photo?: TelegramPhoto[];
}

interface TelegramEvent {
    update_id: number;
    message: TelegramMessage;
}

@Injectable()
export class TelegramWebhookService {
    constructor(
        private readonly activityService: ActivityService,
        private readonly attachmentService: AttachmentService,
        private readonly privateDataService: PrivateConversationDataService,
        private readonly createConversationService: CreateConversationService,
        private readonly channelConfigService: ChannelConfigService,
    ) {}

    async handleMessage(tlgMsg: TelegramEvent, channelConfigToken: string) {
        const { message } = tlgMsg;

        // ignora quando a mensagem é um "evento" e não possui texto (ex: membro bloqueado) 
        if (!message) {
            return;
        }

        let fileId: string;
        if (message.text) {
            return await this.handleTextMessage(message, channelConfigToken);
        } else if (message.voice) {
            fileId = message.voice.file_id;
        } else if (message.photo) {
            if (isArray(message.photo)) {
                fileId = message.photo[message.photo.length - 1].file_id;
            }
        } else if (message.document) {
            fileId = message.document.file_id;
        } else {
            console.log('message', message);
        }
        if (fileId) {
            this.handleMediaMessage(message, channelConfigToken, fileId);
        }
    }

    private async handleMediaMessage(tlgMsg: TelegramMessage, channelConfigToken: string, fileId: string) {
        const { conversation, startActivity } = await this.getConversation(tlgMsg, channelConfigToken);
        if (!conversation) {
            return;
        }
        const privateConversationData = await this.privateDataService.findOne({ conversationId: conversation._id });
        const telegramInfos = privateConversationData.privateData;
        const fileInfos = (
            await axios.post(`https://api.telegram.org/bot${telegramInfos.apiToken}/getFile`, {
                file_id: fileId,
            })
        )?.data?.result;
        if (!fileInfos) {
            return;
        }
        const url = `https://api.telegram.org/file/bot${telegramInfos.apiToken}/${fileInfos.file_path}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        if (!response) {
            return;
        }
        const getFileNameFromHeader = (name: string): string => {
            try {
                return name
                    .split('=')[1]
                    .trim()
                    .replace(/^\"+|\"+$/g, '');
            } catch (e) {
                return uuid.v4();
            }
        };
        const fileName = getFileNameFromHeader(response.headers['content-disposition'] as string);
        const fileExtension = response.headers['content-type'].split('/')[1];
        const buffer = Buffer.from(response.data, 'binary');
        const type = await fileTypeLib.fromBuffer(buffer);
        const mimetype = type.mime;
        const fileToUpload: FileToUpload = {
            buffer,
            encoding: '',
            mimetype: mimetype || response.headers['content-type'],
            size: buffer.byteLength,
            originalname: fileName,
            extension: fileExtension,
        };
        if (startActivity) {
            const attachment = await this.attachmentService.createAndUpload(
                fileToUpload,
                castObjectIdToString(conversation._id),
                this.getMemberId(tlgMsg),
                true,
            );
            startActivity.attachmentFile = {
                contentType: attachment.mimeType,
                contentUrl: attachment.attachmentLocation,
                name: attachment.name,
                key: attachment.key,
            };
            await this.activityService.handleActivity(
                startActivity,
                castObjectIdToString(conversation._id),
                conversation,
            );
        } else {
            await this.attachmentService.createAndUpload(
                fileToUpload,
                castObjectIdToString(conversation._id),
                this.getMemberId(tlgMsg),
                false,
            );
        }
    }

    private async handleTextMessage(tlgMsg: TelegramMessage, channelConfigToken: string) {
        const { conversation, startActivity } = await this.getConversation(tlgMsg, channelConfigToken);
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
            const activity = this.getActivityDto(tlgMsg, conversation, ActivityType.message);
            return await this.activityService.handleActivity(
                activity,
                castObjectIdToString(conversation._id),
                conversation,
            );
        }
    }

    private async getConversation(
        tlgMsg: TelegramMessage,
        channelConfigToken: string,
    ): Promise<{
        conversation: Conversation | null;
        startActivity?: ActivityDto;
    }> {
        const memberId = this.getMemberId(tlgMsg);
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

        const { conversation, startActivity } = await this.createConversationService.getConversation({
            activityHash: this.getActivityHash(tlgMsg, channelConfigToken),
            activityText: tlgMsg.text || '',
            activityTimestamp: moment().valueOf(),
            channelConfigToken,
            channelId: ChannelIdConfig.telegram,
            memberId,
            memberName: `${tlgMsg?.from?.first_name} ${tlgMsg?.from?.last_name ? tlgMsg?.from?.last_name : ''}`,
            privateConversationData: {
                botName: channelConfig?.configData?.botName,
                apiToken: channelConfig?.configData?.apiToken,
                chatId: tlgMsg.chat.id,
            },
        });
        return { conversation, startActivity };
    }

    private getActivityDto(tlgMsg: TelegramMessage, conversation: Conversation, type: ActivityType) {
        const from: Identity = conversation.members.find((member) => member.id == this.getMemberId(tlgMsg));
        const to: Identity = conversation.members.find((member) => member.type == IdentityType.bot);
        const activity: ActivityDto = {
            from,
            type,
            to,
            hash: this.getActivityHash(tlgMsg, conversation.token),
            text: tlgMsg.text,
        };

        activity.timestamp = moment().valueOf();

        if (!!tlgMsg.reply_to_message) {
            activity.quoted = this.getActivityHash(tlgMsg.reply_to_message, conversation.token);
        }

        return activity;
    }

    private getMemberId(tlgMsg: TelegramMessage) {
        return `${tlgMsg.from.id}`;
    }

    private getActivityHash(tlgMsg: TelegramMessage, channelConfigToken: string) {
        return `${channelConfigToken}-${tlgMsg.chat.id}-${tlgMsg.message_id}`;
    }

    getChannelConfigCacheKey(token) {
        return `CHANNEL_CONFIG-${token}`;
    }
}
