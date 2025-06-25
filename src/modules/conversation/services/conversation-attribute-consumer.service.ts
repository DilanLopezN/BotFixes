import { ConversationService } from './conversation.service';
import { KissbotEvent, KissbotEventType } from 'kissbot-core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { KAFKA_INJECT_TOKEN } from '../../_core/kafka/kafka.module';
import { Consumer, Kafka } from 'kafkajs';
import { KafkaService } from '../../_core/kafka/kafka.service';

@Injectable()
export class ConversationAttributeConsumerService {
    private readonly logger = new Logger(ConversationAttributeConsumerService.name);
    private topicName = `conversation_attributes`
    constructor(
        private conversationService: ConversationService,
        private kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({ consumerGroupId: ConversationAttributeConsumerService.name, topic: this.topicName });
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
    //     routingKey: [
    //         KissbotEventType.CONVERSATION_ADD_ATTRIBUTE_REQUEST,
    //         KissbotEventType.CONVERSATION_REMOVE_ATTRIBUTE_REQUEST,
    //     ],
    //     queue: getQueueName('conversation'),
    //     queueOptions: {
    //         durable: true,
    //         channel: ConversationAttributeConsumerService.name,
    //         arguments: {
    //             'x-single-active-consumer': true,
    //         },
    //     },
    // })
    private async dispatch(event: any) {
        if (typeof event !== 'object' || !event.data) return;

        switch (event.type) {
            case KissbotEventType.CONVERSATION_ADD_ATTRIBUTE_REQUEST: {
                return await this.handleAddAttributeRequestEvent(event);
            }
            case KissbotEventType.CONVERSATION_REMOVE_ATTRIBUTE_REQUEST: {
                return await this.handleRemoveAttributeRequestEvent(event);
            }
            default:
                return null;
        }
    }

    private async handleAddAttributeRequestEvent(ev: KissbotEvent) {
        const { conversationId, data } = ev.data as any;
        if (conversationId && data?.length > 0) {
            await this.conversationService.addAttributesToConversation(conversationId, data);
        }
    }

    private async handleRemoveAttributeRequestEvent(ev: KissbotEvent) {
        const { conversationId, name } = ev.data as any;
        if (conversationId && name) {
            await this.conversationService.removeAttributeFromConversation(conversationId, name);
        }
    }

}
