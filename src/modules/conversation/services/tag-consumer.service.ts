import { ConversationService } from './conversation.service';
import { KissbotEvent, KissbotEventType } from 'kissbot-core';
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../common/utils/get-queue-name';

@Injectable()
export class TagConsumerService {

    private readonly logger = new Logger(TagConsumerService.name);

    constructor(private conversationService: ConversationService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [
            KissbotEventType.CONVERSATION_TAGS_UPDATE_REQUEST,
        ],
        queue: getQueueName('conversation-tags'),
        queueOptions: {
            durable: true,
            channel: TagConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async dispatch(event: any) {
        if (typeof event !== 'object' || !event.data) return;

        switch (event.type) {
            case KissbotEventType.CONVERSATION_TAGS_UPDATE_REQUEST: {
                return await this.handleTagsUpdateRequestEvent(event);
            }
            case KissbotEventType.CONVERSATION_ADD_ATTRIBUTE_REQUEST: {
                return await this.handleAddAttributeRequestEvent(event);
            }
            case KissbotEventType.CONVERSATION_REMOVE_ATTRIBUTE_REQUEST: {
                return await this.handleRemoveAttributeRequestEvent(event);
            }
            default:
                return null;
        }
    }

    private async handleTagsUpdateRequestEvent(ev: KissbotEvent) {
        const data: any = ev.data;
        const conversationId = data.conversation?.id || data.conversation?._id;
        if (conversationId && data.tags?.length > 0) {
            await this.conversationService.addTags(conversationId, data.tags);
        }
    }

    private async handleAddAttributeRequestEvent(ev: KissbotEvent) {
        const { conversationId, data } = ev.data as any;
        if (conversationId && data?.length > 0) {
            await this.conversationService.addAttributesToConversation(conversationId, data);
        }
    }

    private async handleRemoveAttributeRequestEvent(ev: KissbotEvent) {
        const { conversationId, name } = ev.data as any;
        if (conversationId && name) {
            await this.conversationService.removeAttributeFromConversation(conversationId, name);
        }
    }

}
