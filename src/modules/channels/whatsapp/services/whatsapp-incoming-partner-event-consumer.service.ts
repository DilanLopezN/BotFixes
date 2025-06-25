import { Injectable, Logger } from '@nestjs/common';
import { KissbotEvent, MetaWhatsappIncomingTemplateEvent } from 'kissbot-core';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../common/utils/prom-metrics';
import { KafkaService } from '../../../_core/kafka/kafka.service';
import { WhatsappIncomingEvent } from '../interfaces/whatsapp.incoming-event.interface';
import { WhatsappUtilService } from './whatsapp-util.service';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class MetaWhatsappIncomingPartnerEventConsumer {
    private readonly logger = new Logger(MetaWhatsappIncomingPartnerEventConsumer.name);
    private topicName = `meta_whatsapp_incoming_partner_event`;

    constructor(
        private readonly whatsappUtilService: WhatsappUtilService,
        private readonly externalDataService: ExternalDataService,
        private kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        console.log('MetaWhatsappIncomingTemplateEventConsumer.startKafkaConsumer');
        const consumer = await this.kafkaService.getKafkaConsumer({
            consumerGroupId: MetaWhatsappIncomingPartnerEventConsumer.name,
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
        const timer = rabbitMsgLatency.labels(MetaWhatsappIncomingPartnerEventConsumer.name).startTimer();
        rabbitMsgCounter.labels(MetaWhatsappIncomingPartnerEventConsumer.name).inc();
        try {
            const data: WhatsappIncomingEvent = ev.data as WhatsappIncomingEvent;
            const channelConfig = await this.externalDataService.getChannelConfigByToken(data.channelConfigToken);
            const service = await this.whatsappUtilService.getService(channelConfig);

            await service.handleIncomingTemplateEvent(
                data.message as MetaWhatsappIncomingTemplateEvent,
                data.channelConfigToken,
            );
        } catch (e) {
            rabbitMsgCounterError.labels(MetaWhatsappIncomingPartnerEventConsumer.name).inc();
        }
        timer();
    }
}
