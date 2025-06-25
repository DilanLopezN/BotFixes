import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AckType, IWhatswebMessageAck, KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import * as moment from 'moment';
import { ObjectId } from 'mongoose';
import { Activity } from './../../../activity/interfaces/activity';
import { Conversation } from './../../../conversation/interfaces/conversation.interface';
import { EventsService } from './../../../events/events.service';
import { PrivateConversationDataService } from './../../../private-conversation-data/services/private-conversation-data.service';
import { castObjectIdToString } from '../../../../common/utils/utils';

export const TelegramChannelId = 'telegram';

@Injectable()
export class ChannelTelegramConsumerService {
    private readonly logger = new Logger(ChannelTelegramConsumerService.name);
    constructor(
        private readonly privateDataService: PrivateConversationDataService,
        private readonly eventsService: EventsService,
    ) {}
    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: TelegramChannelId + '.outgoing',
        queue: TelegramChannelId + '.outgoing',
        queueOptions: {
            durable: true,
            channel: ChannelTelegramConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async handleTelegramEvent(event) {
        try {
            const activity: Activity = event.activity as Activity;
            const conversation: Conversation = event.conversation as Conversation;
            let response;
            if (activity.attachmentFile) {
                response = await this.sendMediaMessageToTelegram(conversation, activity);
            } else {
                response = await this.sendTextMessageToTelegram(conversation, activity);
            }

            await this.eventsService.sendEvent({
                data: {
                    ack: AckType.ServerAck,
                    hash: [activity.hash],
                    timestamp: moment().format().valueOf(),
                } as IWhatswebMessageAck,
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.CONVERSATION_MANAGER,
                type: KissbotEventType.WHATSWEB_MESSAGE_ACK,
            });
        } catch (error) {
            console.log('error conversation consumer', error);
        }
    }

    private async sendMediaMessageToTelegram(conversation: Conversation, activity: Activity) {
        const mediaUrl = activity.attachmentFile.contentUrl;
        const telegramInfos = await this.getTelegramAccountInfos(castObjectIdToString(conversation._id));
        if (activity.attachmentFile.contentType.startsWith('image')) {
            const response = await axios.post(`https://api.telegram.org/bot${telegramInfos.apiToken}/sendPhoto`, {
                photo: mediaUrl,
                chat_id: telegramInfos.chatId,
            });
            return response.data;
        } else if (activity.attachmentFile.contentType.startsWith('video')) {
            const response = await axios.post(`https://api.telegram.org/bot${telegramInfos.apiToken}/sendVideo`, {
                video: mediaUrl,
                chat_id: telegramInfos.chatId,
            });
            return response.data;
        } else if (activity.attachmentFile.contentType.startsWith('audio')) {
            const response = await axios.post(`https://api.telegram.org/bot${telegramInfos.apiToken}/sendAudio`, {
                audio: mediaUrl,
                chat_id: telegramInfos.chatId,
            });
            return response.data;
        } else {
            const response = await axios.post(`https://api.telegram.org/bot${telegramInfos.apiToken}/sendDocument`, {
                document: mediaUrl,
                chat_id: telegramInfos.chatId,
            });
            return response.data;
        }
    }

    formatText(text: string) {
        const tags = {
            '*': { open: '<b>', close: '</b>' },
            '```': { open: '<b>', close: '</b>' },
        };
        const tag = '*';
        let isOpenningTag = false;
        let isCloseningTag = false;
        let tagPosition = text.indexOf(tag);
        while (tagPosition > -1) {
            if (tagPosition > -1 && !isOpenningTag) {
                isOpenningTag = true;
            } else {
                isCloseningTag = true;
                isOpenningTag = false;
            }
            if (isOpenningTag) {
                text = text.replace('*', '<b>');
            }
            if (isCloseningTag) {
                text = text.replace('*', '</b>');
                isCloseningTag = false;
            }
            tagPosition = text.indexOf(tag);
        }
        console.log('text', text);
        return text;
    }

    private async sendTextMessageToTelegram(conversation: Conversation, activity: Activity) {
        if (!activity.text) {
            return;
        }
        const telegramInfos = await this.getTelegramAccountInfos(castObjectIdToString(conversation._id));
        const response = await axios.post(`https://api.telegram.org/bot${telegramInfos.apiToken}/sendMessage`, {
            text: activity.text?.replace('```', '``` ').replace(/\\n/g, ''),
            chat_id: telegramInfos.chatId,
            parse_mode: 'Markdown',
        });
        return response.data;
    }

    async getTelegramAccountInfos(conversationId: string | ObjectId) {
        const privateConversationData = await this.privateDataService.findOne({ conversationId });
        return privateConversationData.privateData;
    }
}
