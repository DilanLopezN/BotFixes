import { Inject, Logger } from "@nestjs/common";
import { Kafka, Consumer, Admin, Producer } from "kafkajs";
import { KAFKA_ADMIN_INJECT_TOKEN, KAFKA_INJECT_TOKEN, KAFKA_PRODUCER_INJECT_TOKEN } from "./kafka.module";
import * as moment from 'moment';
import { getTopicPrefix } from "kissbot-core"
import { shouldStartInternalApi } from "../../../common/utils/bootstrapOptions";

interface StartConsumerData {
    topic: string;
    consumerGroupId: string;
}

enum ConsumerGroupStatus {
    connecting = 'connecting',
    connected = 'connected',
    disconnected = 'disconnected',
}
interface ConsumerGroupResume {
    consumerGroupId: string;
    status: ConsumerGroupStatus;
    disconnectedTimestamp: number;
    disconnectCount: number;
}

export class KafkaService {
    private logger = new Logger(KafkaService.name);

    private readonly healthCheckTimeThreshold = 10000 // Considerado unhealthy depois de 10k milisegundos
    private readonly consumerGroupResume: {[key:string]: ConsumerGroupResume} = {}

    constructor(
        @Inject(KAFKA_INJECT_TOKEN)
        private kafka: Kafka,
        @Inject(KAFKA_ADMIN_INJECT_TOKEN)
        private admin: Admin,
        @Inject(KAFKA_PRODUCER_INJECT_TOKEN)
        private producer: Producer,
    ) {}

    async getKafkaConsumer(data: StartConsumerData): Promise<Consumer> {
        const topicName = getTopicPrefix(data.topic);
        const consumerGroupId = getTopicPrefix(data.consumerGroupId);
        if(!shouldStartInternalApi()) {
            this.logger.warn('Omitting start kafka consumer TOPIC: ' + data.topic + ' - GROUP:' + data.consumerGroupId);
            this.consumerGroupResume[consumerGroupId] = {
                consumerGroupId: consumerGroupId,
                status: ConsumerGroupStatus.connected,
                disconnectedTimestamp: 0,
                disconnectCount: 0,
            }
            return {
                run: async (...args) => {}
            } as Consumer;
        }
        this.logger.log('Starting kafka consumer TOPIC: ' + data.topic + ' - GROUP:' + data.consumerGroupId);
        if (this.consumerGroupResume[consumerGroupId]) {
            throw `${consumerGroupId} Already exists - status: ${this.consumerGroupResume[consumerGroupId].status}`
        }
        this.consumerGroupResume[consumerGroupId] = {
            consumerGroupId: consumerGroupId,
            status: ConsumerGroupStatus.connecting,
            disconnectedTimestamp: 0,
            disconnectCount: 0,
        }
        this.logger.log(`Connecting consumer on topic ${topicName}`);
        const consumer = this.kafka.consumer({ groupId: consumerGroupId });
        consumer.on('consumer.connect', (ev) => {
            this.logger.log(`Connected consumer on topic ${topicName}`);
            this.consumerGroupResume[consumerGroupId] = {
                consumerGroupId: consumerGroupId,
                status: ConsumerGroupStatus.connected,
                disconnectedTimestamp: 0,
                disconnectCount: this.consumerGroupResume[consumerGroupId].disconnectCount,
            }
        })
        consumer.on('consumer.disconnect', (ev) => {
            this.consumerGroupResume[consumerGroupId] = {
                consumerGroupId: consumerGroupId,
                status: ConsumerGroupStatus.disconnected,
                disconnectedTimestamp: moment().valueOf(),
                disconnectCount: (this.consumerGroupResume[consumerGroupId].disconnectCount + 1),
            }
            this.logger.log(`Disconnected consumer on topic ${topicName}: ${JSON.stringify(ev)}`);
        })
        await consumer.connect();
        await consumer.subscribe({ topic: topicName });
        return consumer
    }

    async ping(): Promise<boolean> {
        const now = moment().valueOf();
        const disconnectedList = Object.values(this.consumerGroupResume).filter(resume => {
            const diff = now - resume.disconnectedTimestamp;
            return (resume.status == ConsumerGroupStatus.disconnected && diff > this.healthCheckTimeThreshold);
        });
        return (disconnectedList.length == 0);
    }
    async getKafkaList() {
        // const topics = await this.admin.listTopics();
        return await this.admin.fetchTopicOffsets('local_incoming_gupshup_message')
        // return (await this.admin.fetchTopicMetadata({topics: ['local_incoming_gupshup_message']}));
    }

    async sendEvent(message: any, key: string, topic: string) {
        const topicName = getTopicPrefix(topic);
        return await this.producer.send({
            messages: [
                {
                    key: key,
                    value: JSON.stringify(message)
                }
            ],
            topic: topicName,
        });
    }
}