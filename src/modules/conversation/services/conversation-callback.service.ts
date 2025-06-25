import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { KissbotEventType } from "kissbot-core";
import { getQueueName } from "../../../common/utils/get-queue-name";
import { ConversationService } from "./conversation.service";

@Injectable()
export class ConversationCallbackService {
    private readonly logger = new Logger(ConversationCallbackService.name);
    constructor(
        private readonly conversationService: ConversationService
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [
            KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_RESPONSE,
        ],
        queue: getQueueName('conversation-callback'),
        queueOptions: {
            durable: true,
            channel: ConversationCallbackService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    async dispatch(event: any) {
        try {
            if (typeof event !== 'object'
                || !event.data
            ) return;

            switch (event.type) {
                case KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_RESPONSE:
                    this.conversationService.createConversationCallback(event.data as any);
            }
        } catch (e) {
            console.log('ConversationCallbackService.dispatch', event.type, JSON.stringify(event.data));
            throw e;
        }
    }
}