import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { IGupshupMessageDeliveredEvent, KissbotEvent, KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../../common/utils/get-queue-name';
import { GupshupService } from './gupshup.service';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from "../../../../common/utils/prom-metrics";
import { KafkaService } from '../../../_core/kafka/kafka.service';

@Injectable()
export class GupshupIncomingAckConsumer {
    private readonly logger = new Logger(GupshupIncomingAckConsumer.name);
    private topicName = `incoming_gupshup_ack`;

    constructor(
        private readonly gshpService: GupshupService,
        private kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({ consumerGroupId: GupshupIncomingAckConsumer.name, topic: this.topicName });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageJson = JSON.parse(message?.value?.toString?.());
                if (messageJson.data) {
                    this.dispatchEvent(messageJson)
                }
            },
        });
    }

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.GUPSHUP_ACK_DELIVERED,
        queue: getQueueName('gupshup-ack'),
        queueOptions: {
            durable: true,
            channel: GupshupIncomingAckConsumer.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    async dispatchEvent(ev: KissbotEvent) {
        const timer = rabbitMsgLatency.labels(GupshupIncomingAckConsumer.name).startTimer();
        rabbitMsgCounter.labels(GupshupIncomingAckConsumer.name).inc();
        try {
            switch (ev.type) {
                case KissbotEventType.GUPSHUP_ACK_DELIVERED: {
                    const data: IGupshupMessageDeliveredEvent = ev.data as IGupshupMessageDeliveredEvent;
                    await this.gshpService.handleWhatsappAck(data.message, data.channelConfigToken, data.workspaceId);
                }
            }
        } catch (e) {
            rabbitMsgCounterError.labels(GupshupIncomingAckConsumer.name).inc();
        }
        timer();
    }
}
