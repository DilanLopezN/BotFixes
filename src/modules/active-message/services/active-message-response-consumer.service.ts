import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { KissbotEventType } from "kissbot-core";
import { getQueueName } from "../../../common/utils/get-queue-name";
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from "../../../common/utils/prom-metrics";
import { ActiveMessageService } from "./active-message.service";

@Injectable()
export class ActiveMessageResponseConsumerService {

    private readonly logger = new Logger(ActiveMessageResponseConsumerService.name);
    constructor(
        private readonly activeMessageService: ActiveMessageService
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [KissbotEventType.CAMPAIGN_EVENT, KissbotEventType.ACTIVE_MESSAGE_RESPONSE],
        queue: getQueueName('active-message-campaign'),
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: ActiveMessageResponseConsumerService.name,
        },
    })
    async dispatch(event: any) {
        const timer = rabbitMsgLatency.labels(ActiveMessageResponseConsumerService.name).startTimer();
        rabbitMsgCounter.labels(ActiveMessageResponseConsumerService.name).inc();
        try {
            if (typeof event !== 'object'
                || !event.data
            ) return;

            switch (event.type) {
                case KissbotEventType.CAMPAIGN_EVENT:
                case KissbotEventType.ACTIVE_MESSAGE_RESPONSE:
                    await this.activeMessageService.updateActiveMessageStatusByConversationId(
                        event.data?.conversationId,
                        event.data?.workspaceId,
                        event.data?.status,
                    )
                    break;
            }
        } catch (e) {
            console.log('CampaignConsumerService.dispatch', event.type, JSON.stringify(event.data));
            rabbitMsgCounterError.labels(ActiveMessageResponseConsumerService.name).inc();
            throw e;
        }
        timer();
    }
}