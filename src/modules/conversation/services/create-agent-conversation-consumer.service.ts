import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { AgentCreateConversationEventData } from '../interfaces/create-conversation-event-data.interface';
import { ConversationService, createAgentConversationTopicName } from './conversation.service';

@Injectable()
export class CreateAgentConversationConsumerService {
    constructor(private readonly conversationService: ConversationService, private kafkaService: KafkaService) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({
            consumerGroupId: CreateAgentConversationConsumerService.name,
            topic: createAgentConversationTopicName,
        });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageJson: AgentCreateConversationEventData = JSON.parse(message?.value?.toString?.());
                if (messageJson) {
                    try {
                        this.conversationService.processAgentCreateConversation(messageJson);
                    } catch (e) {
                        console.log('CreateConversationConsumerService', e);
                    }
                }
            },
        });
    }
}
