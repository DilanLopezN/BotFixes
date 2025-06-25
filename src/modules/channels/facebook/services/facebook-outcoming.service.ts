import { Injectable, Logger } from '@nestjs/common';
import { AckType, ActivityType, IActivityAck, KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { CacheService } from '../../../_core/cache/cache.service';
import { Activity } from '../../../activity/interfaces/activity';
import { ChannelIdConfig } from '../../../channel-config/interfaces/channel-config.interface';
import { Conversation } from '../../../conversation/interfaces/conversation.interface';
import { EventsService } from '../../../events/events.service';
import * as moment from 'moment';
import { PrivateConversationDataService } from '../../../private-conversation-data/services/private-conversation-data.service';
import { FacebookApiService } from './facebook-api.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class FacebookOutcomingConsumerService {
    
    private readonly logger = new Logger(FacebookOutcomingConsumerService.name);

    constructor(
        public readonly eventsService: EventsService,
        public cacheService: CacheService,
        private privateDataService: PrivateConversationDataService,
        private readonly facebookApiService: FacebookApiService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: ChannelIdConfig.facebook + '.outgoing',
        queue: ChannelIdConfig.facebook + '.outgoing',
        queueOptions: {
            durable: true,
            channel: FacebookOutcomingConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async handleEventFacebook(event) {
        try {
            await this.handleEvent(event);
        } catch (e) {
            this.logger.error(e);
        }
    }


    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: ChannelIdConfig.instagram + '.outgoing',
        queue: ChannelIdConfig.instagram + '.outgoing',
        queueOptions: {
            durable: true,
            channel: FacebookOutcomingConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async handleEventInstagram(event) {
        try {
            await this.handleEvent(event);
        } catch (e) {
            this.logger.error(e);
        }
    }

    private async handleEvent(event) {
        try {
            // const event = JSON.parse(msg.content.toString());
            const activity: Activity = event.activity as Activity;
            const conversation: Conversation = event.conversation as Conversation;

            if (
                activity.type != ActivityType.message &&
                activity.type != ActivityType.member_upload_attachment && 
                activity.type != ActivityType.rating_message
            ) {
                return;
            }

            let response: { messageId: string };
            try {
                if (activity.attachmentFile) {
                    await this.sendMediaMessageToFacebook(conversation, activity);
                } else if (activity.text) {
                    await this.sendTextMessageToFacebook(conversation, activity);
                } else if (activity.attachments.length) {
                    // response = await this.sendQuickReplyMessageToGupshup(conversation, activity);
                }

            } catch (e) {
                console.log(e);
            }
        } catch (e) {
            console.log('Error on OutcomingConsumer', e);
        }
    }

    async sendTextMessageToFacebook(conversation, activity) {
        const privateData = await this.privateDataService.findOneByConversationId(conversation._id);
        await this.facebookApiService.sendMessage({
            message: {
                text: activity.text,
            },
            messaging_type: 'UPDATE',
            recipient: {
                id: activity.to.id,
            }
        }, privateData.privateData.facebookApiToken)
        await this.sendSentAck(activity.hash);
    }

    async sendMediaMessageToFacebook(conversation, activity) {
        const file = activity.attachmentFile;
        const privateData = await this.privateDataService.findOneByConversationId(conversation._id);
        let type: any = 'file';
        if (file.contentType?.contains?.('video')) {
            type = 'video'
        }
        if (file.contentType?.contains?.('audio')) {
            type = 'audio'
        }
        if (file.contentType?.contains?.('image')) {
            type = 'image'
        }
        await this.facebookApiService.sendMessage({
            message: {
                attachment:{
                    type, 
                    payload:{
                      url: file.contentUrl, 
                    }
                }
            },
            messaging_type: 'UPDATE',
            recipient: {
                id: activity.to.id,
            }
        }, privateData.privateData.facebookApiToken)
        await this.sendSentAck(activity.hash);
    }

    async sendSentAck(activityHash: string){
        this.eventsService.sendEvent({
            data: {
                ack: AckType.ServerAck,
                hash: [activityHash],
                timestamp: moment().format().valueOf(),
            } as IActivityAck,
            dataType: KissbotEventDataType.WHATSWEB_MESSAGE_ACK,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WHATSWEB_MESSAGE_ACK,
        });
    }
}