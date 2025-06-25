import { Injectable, Logger } from '@nestjs/common';
import { ContactService } from './contact.service';
import { KissbotEvent, KissbotEventType } from 'kissbot-core';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../common/utils/get-queue-name';

@Injectable()
export class ContactQueueConsumerService {
    private readonly logger = new Logger(ContactQueueConsumerService.name);

    constructor(private contactService: ContactService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.CONVERSATION_CREATED,
        queue: getQueueName('contact_'),
        queueOptions: {
            durable: true,
            channel: ContactQueueConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    async dispatch(event: KissbotEvent) {
        try {
            // TODO: uncomment this line below after migrate contacts to v2
            // await this.contactService.dispatch(event);
        } catch (e) {
            this.logger.error(`dispatch ${JSON.stringify(e)}`);
        }
    }
}
