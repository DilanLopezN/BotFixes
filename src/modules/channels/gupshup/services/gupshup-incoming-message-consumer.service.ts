import { Injectable, Logger } from '@nestjs/common';
import { IGupshupMessageDeliveredEvent, KissbotEvent, KissbotEventType } from 'kissbot-core';
import { GupshupService } from './gupshup.service';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../common/utils/prom-metrics';
import { KafkaService } from '../../../_core/kafka/kafka.service';

@Injectable()
export class GupshupIncomingMessageConsumer {
    private readonly logger = new Logger(GupshupIncomingMessageConsumer.name);
    private topicName = `incoming_gupshup_message`;

    constructor(private readonly gshpService: GupshupService, private kafkaService: KafkaService) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({
            consumerGroupId: GupshupIncomingMessageConsumer.name,
            topic: this.topicName,
        });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageJson = JSON.parse(message?.value?.toString?.());
                if (messageJson.data) {
                    this.dispatchEvent(messageJson);
                }
            },
        });
    }

    // @RabbitSubscribe({
    //     exchange: process.env.EVENT_EXCHANGE_NAME,
    //     routingKey: KissbotEventType.GUPSHUP_MESSAGE_DELIVERED,
    //     queue: getQueueName('gupshup'),
    //     queueOptions: {
    //         durable: true,
    //         channel: GupshupIncomingMessageConsumer.name,
    //         arguments: {
    //             'x-single-active-consumer': true,
    //         },
    //     },
    // })
    async dispatchEvent(ev: KissbotEvent) {
        const timer = rabbitMsgLatency.labels(GupshupIncomingMessageConsumer.name).startTimer();
        rabbitMsgCounter.labels(GupshupIncomingMessageConsumer.name).inc();
        try {
            switch (ev.type) {
                case KissbotEventType.GUPSHUP_MESSAGE_DELIVERED: {
                    const data: IGupshupMessageDeliveredEvent = ev.data as IGupshupMessageDeliveredEvent;
                    await this.gshpService.handleWhatsappMessage(
                        data.message,
                        data.channelConfigToken,
                        data.workspaceId,
                    );
                }
            }
        } catch (e) {
            rabbitMsgCounterError.labels(GupshupIncomingMessageConsumer.name).inc();
        }
        timer();
    }
}
