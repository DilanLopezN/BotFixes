import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { SmtReService } from './smt-re.service';

@Injectable()
export class ConversationClosedConsumerService {
    private readonly logger = new Logger(ConversationClosedConsumerService.name);

    constructor(private readonly smtReService: SmtReService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.CONVERSATION_CLOSED,
        queue: getQueueName('smart-reengagement-close-conversation'),
        queueOptions: {
            durable: true,
            channel: ConversationClosedConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async dispatch(event: any) {
        if (typeof event !== 'object' || !event.data) return;
        if (event?.data?.smtReId && event?.data?._id) {
            return await this.smtReService.stopSmtRe(event.data._id);
        }
    }
}
