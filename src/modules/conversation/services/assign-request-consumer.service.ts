import { Injectable, Logger } from "@nestjs/common";
import { KissbotEvent, KissbotEventType } from "kissbot-core";
import { ConversationService } from "./conversation.service";
import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { getQueueName } from "../../../common/utils/get-queue-name";

@Injectable()
export class AssignRequestConsumerService {

    private readonly logger = new Logger(AssignRequestConsumerService.name);

    constructor(private conversationService: ConversationService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.CONVERSATION_ASSIGN_REQUEST,
        queue: getQueueName('conversation.assign-request'),
        queueOptions: {
            durable: true,
            channel: AssignRequestConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async dispatch(event: any) {
        if (typeof event !== 'object' || !event.data) return;

        switch (event.type) {
            case KissbotEventType.CONVERSATION_ASSIGN_REQUEST: {
                return await this.handleConversationAssignRequestEvent(event);
            }
            default:
                return null;
        }
    }

    private async handleConversationAssignRequestEvent(ev: KissbotEvent) {
        const data = ev.data as any;
        const {
            team: { _id, workspaceId },
            assignedByMember: { id },
            priority,
            conversationId,
        } = data;
        if (_id && workspaceId && id && conversationId) {
            if (typeof priority == 'number') {
                await this.conversationService.updateConversationPriority(conversationId, priority);
            }
            await this.conversationService.transferConversation(conversationId, id, _id, workspaceId, false, true);
        }
    }
}