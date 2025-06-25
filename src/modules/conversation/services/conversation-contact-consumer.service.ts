import { ConversationService } from './conversation.service';
import { KissbotEvent, KissbotEventType } from 'kissbot-core';
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../common/utils/get-queue-name';

@Injectable()
export class ConversationContactConsumerService {

    private readonly logger = new Logger(ConversationContactConsumerService.name);

    constructor(private conversationService: ConversationService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [
            KissbotEventType.CONVERSATION_MEMBER_CONTACT_ID_UPDATE_REQUEST,
        ],
        queue: getQueueName('conversation-contact-consumer'),
        queueOptions: {
            durable: true,
            channel: ConversationContactConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async dispatch(event: any) {
        if (typeof event !== 'object' || !event.data) return;

        switch (event.type) {
            case KissbotEventType.CONVERSATION_MEMBER_CONTACT_ID_UPDATE_REQUEST: {
                await this.handleMemberContactIdUpdateRequest(event);
                break;
            }
            default:
                return null;
        }
    }

    private async handleMemberContactIdUpdateRequest(ev: KissbotEvent) {
        try {
            const data: any = ev.data;
            await this.conversationService.updateMemberContactId(data._id, data.members?.[0]);
        } catch (e) {
            console.log('handleMemberContactIdUpdateRequest', e);
        }
    }

}
