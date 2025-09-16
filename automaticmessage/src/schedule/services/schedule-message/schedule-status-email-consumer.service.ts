import { Injectable, Logger } from '@nestjs/common';
import { ScheduleMessageService } from './schedule-message.service';
import { KissbotEventType } from 'kissbot-core';
import { KafkaService } from '../../../kafka/kafka.service';
import { emailStatusTopic } from '../../../miscellaneous/utils';

@Injectable()
export class ScheduleStatusEmailConsumerService {
  private readonly logger = new Logger(ScheduleStatusEmailConsumerService.name);

  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
    private kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    this.startKafkaConsumer();
  }

  private async startKafkaConsumer() {
    const consumer = await this.kafkaService.getKafkaConsumer({
      consumerGroupId: ScheduleStatusEmailConsumerService.name,
      topic: emailStatusTopic,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageJson: {
          eventType: string;
          workspaceId: string;
          externalId: string;
        } = JSON.parse(message?.value?.toString?.());
        if (messageJson) {
          try {
            const now = new Date()?.toISOString?.();
            switch (messageJson.eventType) {
              case KissbotEventType.EMAIL_SENT: {
                await this.scheduleMessageService.updateScheduleMessageSent(
                  messageJson.externalId,
                  now,
                );
                break;
              }
              case KissbotEventType.EMAIL_DELIVERED: {
                await this.scheduleMessageService.updateScheduleMessageReceivedAt(
                  messageJson.externalId,
                  now,
                );
                break;
              }
              case KissbotEventType.EMAIL_OPENED: {
                await this.scheduleMessageService.updateScheduleMessageReadAt(
                  messageJson.externalId,
                  now,
                );
                break;
              }
            }
          } catch (e) {
            console.log('ScheduleStatusEmailConsumerService', e);
          }
        }
      },
    });
  }
}
