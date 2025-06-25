import { Injectable, Logger } from '@nestjs/common';
import { KissbotEvent } from 'kissbot-core';
import { AmqpService } from '../_core/amqp/amqp.service';
import * as moment from 'moment';
import { v4 } from 'uuid';
import { ActivityReceivedEvent } from '../activity/interfaces/activity-event.interface';
import * as amqp from 'amqp-connection-manager';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name); 
    private publisherChannel: amqp.ChannelWrapper;
    private setupLock = false;
    constructor(
        private readonly amqpService: AmqpService,
    ) {
        this.setup();
    }

    setup = async () => {
        this.setupLock = true;
        const conn = this.amqpService.getConnection()
        this.publisherChannel = await conn.createChannel({
            setup: async (channel) => {
                this.logger.log(`Created publisher channel`)
                return channel;
            },
        });
        this.setupLock = false;
    }

    async awaitPublisher() {
        let times = 0;
        while (this.setupLock) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            times++;
        }
    }

    async sendEvent(event: KissbotEvent, customRoutingKey?: string, options?) {
        await this.awaitPublisher();
        event.id = v4();
        event.timestamp = moment().format();
        const published = await this.publisherChannel.publish(
            this.amqpService.getEventExchangeName(),
            customRoutingKey || event.type,
            Buffer.from(JSON.stringify(event)),
            options,
        );
    }

    async sendLogEvent(event: KissbotEvent, customRoutingKey?: string, options?) {

        //TODO: VAMOS DESATIVAR POR HORA PARA NÃO SOBRECARREGAR O RABBIT
        /*

        await this.awaitPublisher();
        event.id = v4();
        event.timestamp = moment().format();
        this.publisherChannel.publish(
            this.amqpService.getLogEventExchangeName(),
            customRoutingKey || event.type,
            new Buffer(JSON.stringify(event)),
            options,
        );

        */
    }

    public getOutgoingEventRoutingKeyPattern(channelId: string): string {
        return channelId + '.outgoing';
    }

    public getOutgoingEventQueueName(channelId: string): string {
        return this.getOutgoingEventRoutingKeyPattern(channelId);
    }

    async sendActivityEvent(event: ActivityReceivedEvent, channelId: string) {
        const routingKey = this.getOutgoingEventRoutingKeyPattern(channelId);
        const stringEvent = JSON.stringify(event);
        const channelExchangeName = this.amqpService.getChannelExchangeName();
        await this.awaitPublisher();
        const published = await this.publisherChannel.publish(
            channelExchangeName,
            routingKey,
            Buffer.from(stringEvent),
        );
    }

}
