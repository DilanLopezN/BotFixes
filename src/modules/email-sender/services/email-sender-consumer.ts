import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { EmailSenderService } from './email-sender.service';
import { KissbotEventType } from 'kissbot-core';
import { EmailCreatedMessage } from '../interfaces/email-created-message.interface';

@Injectable()
export class EmailSenderConsumerService {
    constructor(private readonly EmailSenderService: EmailSenderService, private kafkaService: KafkaService) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({
            consumerGroupId: EmailSenderConsumerService.name,
            topic: KissbotEventType.EMAIL_CREATED,
        });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageJson: EmailCreatedMessage = JSON.parse(message?.value?.toString?.());
                if (messageJson) {
                    try {
                        await this.EmailSenderService.sendEmail(messageJson.workspaceId, messageJson);
                    } catch (e) {
                        console.log('EmailSenderConsumerService', e);
                    }
                }
            },
        });
    }
}
