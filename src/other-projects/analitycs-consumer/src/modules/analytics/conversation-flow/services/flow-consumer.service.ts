import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { KissbotEvent, KissbotEventType } from "kissbot-core";
import { getQueueName } from "../../../../utils/get-queue-name";
import { CreateConversationFlowData } from "../interfaces/create-conversation-flow.interface";
import { ConversationFlowService } from "./converstion-flow.service";

@Injectable()
export class FlowConsumerService {
    private readonly logger = new Logger(FlowConsumerService.name);

    constructor(
        private readonly conversationFlowService: ConversationFlowService
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
        routingKey: [
            KissbotEventType.INTERACTION_RECOGNIZED,
            KissbotEventType.CONVERSATION_CONTEXT_CHANGED,
        ],
        queue: getQueueName('conversation-flow'),
        queueOptions: {
            durable: true,
            channel: FlowConsumerService.name,
        },
    })
    async handleFlowEvent(data: KissbotEvent) {
        try {
            await this.conversationFlowService.createConversationFlow((data.data as any));
        } catch (e) {
            this.logger.error(e);
        }
    }
}