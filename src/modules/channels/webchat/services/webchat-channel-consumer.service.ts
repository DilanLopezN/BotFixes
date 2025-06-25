import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import {
    AckType,
    IWhatswebMessageAck,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType
} from 'kissbot-core';
import * as moment from 'moment';
import { Activity } from '../../../activity/interfaces/activity';
import { KafkaService } from '../../../_core/kafka/kafka.service';
import { EventsService } from './../../../events/events.service';
import { WebchatService } from './webchat.service';
export const ChannelId = 'webchat';
export const ChannelWebemulator = 'webemulator';

@Injectable()
export class WebchatChannelConsumerService {
    
    private readonly logger = new Logger(WebchatChannelConsumerService.name)

    constructor(
        public readonly eventsService: EventsService,
        private readonly webchatService: WebchatService,
        private readonly kafkaService: KafkaService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: ChannelWebemulator + '.outgoing',
        queue: ChannelWebemulator + '.outgoing',
        queueOptions: {
            durable: true,
            channel: WebchatChannelConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async handleEmulator(event) {
        try {
            this.sendMessage(event)
        } catch (e) {
            this.logger.error(e);
        }
    }


    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: ChannelId + '.outgoing',
        queue: ChannelId + '.outgoing',
        queueOptions: {
            durable: true,
            channel: WebchatChannelConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async handleWebchat(event) {
        try {
            this.sendMessage(event)
        } catch (e) {
            this.logger.error(e);
        }
    } 

    sendMessage(event: any) {
        try {
            // const event = JSON.parse(msg.content.toString());
            const activity = this.webchatService.transformActivityAttachments(event.activity as Activity);

            if(activity.type == 'rating') return;
            const memberRoomId = this.webchatService.getMemberRoomId(activity.conversationId, activity.to.id);
            this.webchatService.sendToSocket({
                activities: [{
                    ...activity,
                    socket: true,
                }],
                watermark: '0',
            }, memberRoomId);

            const data = {
                data: {
                    ack: AckType.DeliveryAck,
                    hash: [activity.hash],
                    timestamp: moment().format().valueOf(),
                } as IWhatswebMessageAck,
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.CONVERSATION_MANAGER,
                type: KissbotEventType.WHATSWEB_MESSAGE_ACK,
            }

            this.eventsService.sendEvent(data);

            this.kafkaService.sendEvent(
                data,
                event.conversation.token,
                'activity_ack'
            )
        } catch (e) {
            console.log('Error on WebchatQueueService', e)
        }
    }
}
