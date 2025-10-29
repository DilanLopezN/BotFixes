import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { ActiveMessageCreatedEvent } from '../interfaces/active-message-created-event.interface';
import { SendedCampaignService } from './sended-campaign.service';

@Injectable()
export class ConversationUpdateConsumerService {
    private readonly logger = new Logger(ConversationUpdateConsumerService.name);
    private readonly topicName = 'active_message_created';

    constructor(
        private readonly sendedCampaignService: SendedCampaignService,
        private readonly kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        await this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        this.logger.log(`Starting Kafka consumer for topic: ${this.topicName}`);

        try {
            const consumer = await this.kafkaService.getKafkaConsumer({
                consumerGroupId: ConversationUpdateConsumerService.name,
                topic: this.topicName,
            });

            await consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const messageValue = message?.value?.toString();
                        if (!messageValue) {
                            this.logger.warn('Received empty message from Kafka');
                            return;
                        }

                        const event: ActiveMessageCreatedEvent = JSON.parse(messageValue);
                        await this.handleActiveMessageCreated(event);
                    } catch (error) {
                        this.logger.error('Error processing Kafka message:', error);
                    }
                },
            });

            this.logger.log(`Kafka consumer started successfully for topic: ${this.topicName}`);
        } catch (error) {
            this.logger.error(`Failed to start Kafka consumer for topic ${this.topicName}:`, error);
            throw error;
        }
    }

    private async handleActiveMessageCreated(event: ActiveMessageCreatedEvent) {
        try {
            if (!event.externalId || !event.conversationId) {
                this.logger.warn('Received active message created event without externalId or conversationId', event);
                return;
            }

            this.logger.log(`Processing active message created - externalId: ${event.externalId}`);

            await this.updateConversationId(event.externalId, event.conversationId);

            this.logger.log(`Active message processed successfully for externalId ${event.externalId}`);
        } catch (error) {
            this.logger.error(`Error handling active message created for externalId ${event.externalId}:`, error);
        }
    }

    async updateConversationId(shortId: string, conversationId: string): Promise<void> {
        await this.sendedCampaignService.updateConversationId(shortId, conversationId);
        this.logger.log(`Updated conversation ID for shortId ${shortId}: ${conversationId}`);
    }
}
