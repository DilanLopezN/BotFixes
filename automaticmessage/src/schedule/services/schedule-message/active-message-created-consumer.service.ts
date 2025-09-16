import { Injectable, Logger } from '@nestjs/common';
import { ScheduleMessageService } from './schedule-message.service';
import { activeMessageCreatedTopic } from '../../../miscellaneous/utils';
import { KafkaService } from '../../../kafka/kafka.service';

@Injectable()
export class ActiveMessageCreatedConsumerService {
  private readonly logger = new Logger(
    ActiveMessageCreatedConsumerService.name,
  );

  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
    private kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    this.startKafkaConsumer();
  }

  private async startKafkaConsumer() {
    const consumer = await this.kafkaService.getKafkaConsumer({
      consumerGroupId: ActiveMessageCreatedConsumerService.name,
      topic: activeMessageCreatedTopic,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageJson: {
          conversationId: string;
          workspaceId: string;
          externalId: string;
        } = JSON.parse(message?.value?.toString?.());
        if (messageJson) {
          try {
            await this.scheduleMessageService.updateScheduleMessageConversationId(
              messageJson.externalId,
              messageJson.workspaceId,
              messageJson.conversationId,
            );
          } catch (e) {
            console.log('ScheduleMessageConsumerService', e);
          }
        }
      },
    });
  }
}
