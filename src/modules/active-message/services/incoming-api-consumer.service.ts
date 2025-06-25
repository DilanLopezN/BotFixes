import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { KissbotEventType } from "kissbot-core";
import { getQueueName } from "../../../common/utils/get-queue-name";
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from "../../../common/utils/prom-metrics";
import { SendMessageService } from "./send-message.service";

@Injectable()
export class IncomingApiConsumerService {

    private readonly logger = new Logger(IncomingApiConsumerService.name)

    constructor(
        private readonly sendMessageService: SendMessageService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.SEND_MESSAGE,
        queue: getQueueName('incoming-api-send-message'),
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: IncomingApiConsumerService.name,
        },
    })
    async dispatch(event: any) {
        const timer = rabbitMsgLatency.labels(IncomingApiConsumerService.name).startTimer();
        rabbitMsgCounter.labels(IncomingApiConsumerService.name).inc();
        try {
            if (typeof event !== 'object'
                || !event.data
            ) return;

            switch (event.type) {
                case KissbotEventType.SEND_MESSAGE:
                    await this.sendMessageService.sendMessage(event.data);
                    break;
            }
        } catch (e) {
            this.logger.error(e);
            this.logger.error(JSON.stringify(event.data));
            rabbitMsgCounterError.labels(IncomingApiConsumerService.name).inc();
        }
        timer();
    }
}