import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../common/utils/prom-metrics';
import { CampaignContactService } from './campaign-contact.service';

@Injectable()
export class CampaignMessageStatusConsumerService {
    private readonly logger = new Logger(CampaignMessageStatusConsumerService.name);
    constructor(private readonly campaignContactService: CampaignContactService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.ACTIVE_MESSAGE_USER_RECEIVED,
        queue: getQueueName('campaign-user-received'),
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: CampaignMessageStatusConsumerService.name,
        },
    })
    async dispatch(event: any) {
        const timer = rabbitMsgLatency.labels(CampaignMessageStatusConsumerService.name).startTimer();
        rabbitMsgCounter.labels(CampaignMessageStatusConsumerService.name).inc();
        try {
            if (typeof event !== 'object' || !event.data) return;

            switch (event.type) {
                case KissbotEventType.ACTIVE_MESSAGE_USER_RECEIVED:
                    await this.campaignContactService.updateCampaignContactReceived(
                        event.data.externalId,
                        event.data.receivedAt,
                    );
                    break;
            }
        } catch (e) {
            console.log('CampaignMessageStatusConsumerService.dispatch', event.type, JSON.stringify(event.data));
            rabbitMsgCounterError.labels(CampaignMessageStatusConsumerService.name).inc();
        }
        timer();
    }
}