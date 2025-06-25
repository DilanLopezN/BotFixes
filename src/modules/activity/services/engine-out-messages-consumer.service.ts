import { Injectable, Logger } from "@nestjs/common";
import { KissbotEventType } from "kissbot-core";
import { ActivityService } from "./activity.service";
import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { getQueueName } from "../../../common/utils/get-queue-name";
import { KafkaService } from "../../_core/kafka/kafka.service";

@Injectable()
export class EngineOutMessagesConsumerService {
    private logger = new Logger(EngineOutMessagesConsumerService.name)
    private readonly topicName = 'engine_out_messages';
    constructor(
        private readonly activityService: ActivityService,
        private readonly kafkaService: KafkaService,
    ) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({ consumerGroupId: EngineOutMessagesConsumerService.name, topic: this.topicName });
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            const messageJson = JSON.parse(message?.value?.toString?.());
            if (messageJson.data) {
                // console.log('consumiu kafka');
                this.dispatch(messageJson)
            }
          },
        });
    }

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [
            KissbotEventType.ACTIVITY_RECEIVED_REQUEST,
            KissbotEventType.ACTIVITY_SYNC,
        ],
        queue: getQueueName('activity'),
        queueOptions: {
            durable: true,
            channel: EngineOutMessagesConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    // O RabbitSubscribe CONSIDERA NACK A MENSAGEM QUANDO RETORNA QUALQUER COISA, SEJA UM OBJETO, STRING OU LANÇAMENTO DE EXCEÇÃO
    // POR ISSO SE RETORNAR ALGO A MENSAGEM ENTRA EM LOOP
    // ESSA FILA NÃO PODE ENTRAR EM LOOP
    // SE ENTRAR VAI ENVIAR INFINITAMENTE PARA O GUPSHUP
    // GERANDO COBRANÇA E POSSIVEIS BLOCKS NAS CONTAS
    async consumer(event) {
        // console.log('consumiu rabbit');
        await this.dispatch(event);
    }


    async dispatch(event: any) {
        try {
            if (typeof event !== 'object'
                || !event.data
            ) return;

            if (event.type == KissbotEventType.ACTIVITY_RECEIVED_REQUEST) {
                await this.createActivity(event.data);
            } else if(event.type == KissbotEventType.ACTIVITY_SYNC) {
                await this.syncActivities(event.data);
            }
        } catch (e) {
            this.logger.error(`${'dispatch --' + event.type + '---' + JSON.stringify(event.data)}`);
        }
    }

    private async createActivity(data: any) {
        try {
            const { activity, _id } = data;
            return await this.activityService.handleActivity(activity, _id);
        } catch (e) {
            this.logger.error('ConversationConsumerService.createActivity', e)
        }
    }

    private async syncActivities(eventData: { activities: any[] }) {
        try {
            const createActivitiespromises = eventData.activities.map(async (activity) => {
                try {
                    if (!activity.id) {
                        activity.id = activity._id;
                    }
                    return await this.activityService._create(activity);
                } catch (e) {
                    this.logger.error('syncActivities' + JSON.stringify(e));
                }
            });
            await Promise.all(createActivitiespromises);
        } catch (e) {
            this.logger.error(`syncActivities external try ${JSON.stringify(e)}`);
        }
    }
}