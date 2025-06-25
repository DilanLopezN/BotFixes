import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { CampaignService, campaignTopicName } from './campaign.service';

@Injectable()
export class CampaignConsumerService {
    constructor(private readonly CampaignService: CampaignService, private kafkaService: KafkaService) {}

    async onModuleInit() {
        this.startKafkaConsumer();
    }

    private async startKafkaConsumer() {
        const consumer = await this.kafkaService.getKafkaConsumer({
            consumerGroupId: CampaignConsumerService.name,
            topic: campaignTopicName,
        });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageJson: { campaignId: string } = JSON.parse(message?.value?.toString?.());
                if (messageJson) {
                    try {
                        await this.CampaignService.startCampaign(Number(messageJson.campaignId));
                    } catch (e) {
                        console.log('CampaignConsumerService', e);
                    }
                }
            },
        });
    }
}
