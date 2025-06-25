import { Injectable, Logger } from '@nestjs/common';
import { IGupshupMessageDeliveredEvent, KissbotEvent, KissbotEventType } from 'kissbot-core';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../../../common/utils/prom-metrics';
import { KafkaService } from '../../../../../_core/kafka/kafka.service';
import { GupshupV3IncomingService } from './gupshup-v3.incoming.service';

@Injectable()
export class GupshupV3IncomingMessageConsumer {
    private readonly logger = new Logger(GupshupV3IncomingMessageConsumer.name);
    private topicName = `incoming_gupshup_v3_message`;

    constructor(
        private readonly gupshupV3IncomingService: GupshupV3IncomingService,
        private kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({
            consumerGroupId: GupshupV3IncomingMessageConsumer.name,
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

    async dispatchEvent(ev: KissbotEvent) {
        const timer = rabbitMsgLatency.labels(GupshupV3IncomingMessageConsumer.name).startTimer();
        rabbitMsgCounter.labels(GupshupV3IncomingMessageConsumer.name).inc();
        try {
            switch (ev.type) {
                case KissbotEventType.GUPSHUP_V3_MESSAGE_DELIVERED: {
                    const data: IGupshupMessageDeliveredEvent = ev.data as IGupshupMessageDeliveredEvent;
                    await this.gupshupV3IncomingService.handleWhatsappMessage(
                        data.message as any,
                        data.channelConfigToken,
                        data.workspaceId,
                    );
                }
            }
        } catch (e) {
            rabbitMsgCounterError.labels(GupshupV3IncomingMessageConsumer.name).inc();
        }
        timer();
    }
}
