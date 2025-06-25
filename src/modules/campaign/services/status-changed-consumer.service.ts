
import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { KissbotEventType } from "kissbot-core";
import { getQueueName } from "../../../common/utils/get-queue-name";
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from "../../../common/utils/prom-metrics";
import { CampaignContactService } from "./campaign-contact.service";

@Injectable()
export class CampaignStatusChangedConsumerService {

    private readonly logger = new Logger(CampaignStatusChangedConsumerService.name);
    constructor(
        private readonly campaignContactService: CampaignContactService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.ACTIVE_MESSAGE_STATUS_CHANGED,
        queue: getQueueName('campaign-status-changed'),
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: CampaignStatusChangedConsumerService.name,
        },
    })
    async dispatch(event: any) {
        const timer = rabbitMsgLatency.labels(CampaignStatusChangedConsumerService.name).startTimer();
        rabbitMsgCounter.labels(CampaignStatusChangedConsumerService.name).inc();
        try {
            if (typeof event !== 'object'
                || !event.data
            ) return;

            switch (event.type) {
                case KissbotEventType.ACTIVE_MESSAGE_STATUS_CHANGED:
                    await this.campaignContactService.updateCampaignContactInvalid(event.data.externalId, event.data.status)
                    break;
            }
        } catch (e) {
            console.log('CampaignStatusChangedConsumerService.dispatch', event.type, JSON.stringify(event.data));
            rabbitMsgCounterError.labels(CampaignStatusChangedConsumerService.name).inc();
            throw e;
        }
        timer();
    }
}