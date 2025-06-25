import { Injectable, Logger } from '@nestjs/common';
import { KissbotEvent, KissbotEventType, MetaWhatsappWebhookEvent } from 'kissbot-core';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../common/utils/prom-metrics';
import { KafkaService } from '../../../_core/kafka/kafka.service';
import { WhatsappIncomingEvent } from '../interfaces/whatsapp.incoming-event.interface';
import { WhatsappUtilService } from './whatsapp-util.service';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class MetaWhatsappIncomingAckConsumer {
    private readonly logger = new Logger(MetaWhatsappIncomingAckConsumer.name);
    private topicName = `meta_whatsapp_incoming_ack`;

    constructor(
        private readonly whatsappUtilService: WhatsappUtilService,
        private readonly externalDataService: ExternalDataService,
        private kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        console.log('MetaWhatsappIncomingAckConsumer.startKafkaConsumer');
        const consumer = await this.kafkaService.getKafkaConsumer({
            consumerGroupId: MetaWhatsappIncomingAckConsumer.name,
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
        const timer = rabbitMsgLatency.labels(MetaWhatsappIncomingAckConsumer.name).startTimer();
        rabbitMsgCounter.labels(MetaWhatsappIncomingAckConsumer.name).inc();
        try {
            const data: WhatsappIncomingEvent = ev.data as WhatsappIncomingEvent;
            const channelConfig = await this.externalDataService.getChannelConfigByToken(data.channelConfigToken);
            const service = await this.whatsappUtilService.getService(channelConfig);

            await service.handleIncomingAck(
                data.message as MetaWhatsappWebhookEvent,
                data.channelConfigToken,
                data.workspaceId,
            );
        } catch (e) {
            rabbitMsgCounterError.labels(MetaWhatsappIncomingAckConsumer.name).inc();
        }
        timer();
    }
}
