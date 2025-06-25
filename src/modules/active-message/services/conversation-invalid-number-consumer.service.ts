import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { KissbotEventType } from "kissbot-core";
import { getQueueName } from "../../../common/utils/get-queue-name";
import { ActiveMessageService } from "./active-message.service";

@Injectable()
export class ConversationInvalidNumberConsumerService {
    
    private readonly logger = new Logger(ConversationInvalidNumberConsumerService.name)

    constructor(
        private activeMessageService: ActiveMessageService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.GUPSHUP_NUMBER_DONT_EXISTS_RECEIVED,
        queue: getQueueName('active-message.invalid-number'),
        queueOptions: {
            durable: true,
            channel: ConversationInvalidNumberConsumerService.name,
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
                case KissbotEventType.GUPSHUP_NUMBER_DONT_EXISTS_RECEIVED:
                    this.activeMessageService.updateStatusToInvalid(event.data.conversationId);
                    break;   
            }
        } catch (e) {
            throw e;
        }
    }
}