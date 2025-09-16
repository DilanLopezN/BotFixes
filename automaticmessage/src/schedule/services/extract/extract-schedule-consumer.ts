import { Injectable } from '@nestjs/common';
import { RunExtractData } from '../../interfaces/run-extract-data.interface';
import {
  RunExtractResumeService,
  scheduleTopicName,
} from './run-extract-resume.service';
import { KafkaService } from '../../../kafka/kafka.service';

@Injectable()
export class ExtractScheduleConsumerService {
  constructor(
    private readonly runExtractResumeService: RunExtractResumeService,
    private kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    this.startKafkaConsumer();
  }

  private async startKafkaConsumer() {
    const consumer = await this.kafkaService.getKafkaConsumer({
      consumerGroupId: ExtractScheduleConsumerService.name,
      topic: scheduleTopicName,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageJson: RunExtractData = JSON.parse(
          message?.value?.toString?.(),
        );
        if (messageJson) {
          try {
            this.runExtractResumeService.runExtract(messageJson);
          } catch (e) {
            console.log('ExtractScheduleConsumerService', e);
          }
        }
      },
    });
  }
}
