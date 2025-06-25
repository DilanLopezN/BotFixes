import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { KissbotEventType } from "kissbot-core";
import { ActivityAck, ConversationActivity } from "kissbot-entities";
import { Repository } from "typeorm";
import { getQueueName } from "../../../common/utils/get-queue-name";
import { KafkaService } from "../../_core/kafka/kafka.service";
import { CONVERSATION_CONNECTION } from "../ormconfig";

@Injectable()
export class ActivityV2AckService {

    private readonly logger = new Logger(ActivityV2AckService.name);

    private readonly topicName = 'activity_ack';

    constructor(
        @InjectRepository(ActivityAck, CONVERSATION_CONNECTION)
        private activityAckRepository: Repository<ActivityAck>,
        private kafkaService: KafkaService,
    ){}


    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({ consumerGroupId: ActivityV2AckService.name, topic: this.topicName });
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            const messageJson = JSON.parse(message?.value?.toString?.());
            if (messageJson.data) {
                this.processAck(messageJson)
            }
          },
        });
    }

    // @RabbitSubscribe({
    //     exchange: process.env.EVENT_EXCHANGE_NAME,
    //     routingKey: KissbotEventType.WHATSWEB_MESSAGE_ACK,
    //     queue: getQueueName('ack-postgres'),
    //     queueOptions: {
    //         durable: true,
    //         channel: ActivityV2AckService.name,
    //         arguments: {
    //             'x-single-active-consumer': true,
    //         },
    //     },
    // })
    async processAck(event: any) {
        const { data } = event;
        for(const hash of data.hash) {
            try{
                await this.activityAckRepository.save({
                    ack: data.ack,
                    hash,
                });
            }catch(e){
                if (!((e.message || '') as string).includes('duplicate key value violates unique constraint')) {
                    throw e;
                }
            }
        }
    }

    async saveAck(ack, hash) {
        try {
            await this.activityAckRepository.save({
                ack: ack,
                hash,
            });
        } catch (e) {
            console.log('ERROR', e);
        }
    }
}