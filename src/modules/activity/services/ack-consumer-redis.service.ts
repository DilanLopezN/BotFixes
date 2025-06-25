import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { ActivityService } from './activity.service';

@Injectable()
export class AckConsumerRedisService {
    private readonly logger = new Logger(AckConsumerRedisService.name)
    private readonly topicName = 'activity_ack';
    constructor(
        private readonly activityService: ActivityService,
        private readonly kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({ consumerGroupId: AckConsumerRedisService.name, topic: this.topicName });
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            const messageJson = JSON.parse(message?.value?.toString?.());
            if (messageJson.data) {
                this.dispatch(messageJson)
            }
          },
        });
    }

    // @RabbitSubscribe({
    //     exchange: process.env.EVENT_EXCHANGE_NAME,
    //     routingKey: KissbotEventType.WHATSWEB_MESSAGE_ACK,
    //     queue: getQueueName('ack-redis'),
    //     queueOptions: {
    //         durable: true,
    //         channel: AckConsumerRedisService.name,
    //         arguments: {
    //             'x-single-active-consumer': true,
    //         },
    //     },
    // })
    async dispatch(event: any) {
        try {
            if (typeof event !== 'object' || !event.data) return;

            switch (event.type) {
                case KissbotEventType.WHATSWEB_MESSAGE_ACK:
                    await this.activityService.sendAckToSocket(event.data);
                    return
            }
        } catch (e) {
            console.log('AckConsumerRedisService.dispatch', event.type, JSON.stringify(event.data));
            throw e;
        }
    }
}
