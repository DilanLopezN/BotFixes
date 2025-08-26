import { ConversationService } from './conversation.service';
import { KissbotEvent, KissbotEventType } from 'kissbot-core';
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../common/utils/get-queue-name';

@Injectable()
export class ConversationUserFollowupConsumerService {
    private readonly logger = new Logger(ConversationUserFollowupConsumerService.name);

    constructor(private conversationService: ConversationService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [KissbotEventType.CONVERSATION_USER_FOLLOWUP_RECOGNIZED],
        queue: getQueueName('conversation-user-followup-consumer'),
        queueOptions: {
            durable: true,
            channel: ConversationUserFollowupConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async dispatch(event: any) {
        if (typeof event !== 'object' || !event.data) return;

        switch (event.type) {
            case KissbotEventType.CONVERSATION_USER_FOLLOWUP_RECOGNIZED: {
                await this.handleUserFollowupUpdateRequest(event);
                break;
            }
            default:
                return null;
        }
    }

    private async handleUserFollowupUpdateRequest(ev: KissbotEvent) {
        try {
            const data: any = ev.data;
            await this.conversationService.updateFlagHasUserFollowupByConversationId(
                data.conversationId,
                data.workspaceId,
            );
        } catch (e) {
            console.log('handleUserFollowupUpdateRequest', e);
        }
    }
}
