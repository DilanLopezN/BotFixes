import { Injectable } from '@nestjs/common';
import { sendActiveScheduleTopicName } from './send-active-schedule-incoming.service';
import { ScheduleService } from '../schedule/schedule.service';
import { CreateScheduleAndScheduleMessageData } from '../../interfaces/create-schedule-and-send-message-data.interface';
import { KafkaService } from '../../../kafka/kafka.service';

@Injectable()
export class SendActiveScheduleConsumerService {
  constructor(
    private readonly scheduleService: ScheduleService,
    private kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    this.startKafkaConsumer();
  }

  private async startKafkaConsumer() {
    const consumer = await this.kafkaService.getKafkaConsumer({
      consumerGroupId: SendActiveScheduleConsumerService.name,
      topic: sendActiveScheduleTopicName,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageJson: CreateScheduleAndScheduleMessageData = JSON.parse(
          message?.value?.toString?.(),
        );
        if (messageJson) {
          try {
            this.scheduleService.createScheduleAndScheduleMessage(messageJson);
          } catch (e) {
            console.log('SendActiveScheduleConsumerService', e);
          }
        }
      },
    });
  }
}
