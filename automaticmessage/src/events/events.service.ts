import { Injectable, Logger } from '@nestjs/common';
import { KissbotEvent } from 'kissbot-core';
import * as moment from 'dayjs';
import { v4 } from 'uuid';
import * as amqp from 'amqp-connection-manager';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async sendEvent(event: KissbotEvent, customRoutingKey?: string, options?) {
    event.id = v4();
    event.timestamp = moment().format();
    const sent = await this.amqpConnection.publish(
      process.env.EVENT_EXCHANGE_NAME,
      customRoutingKey || event.type,
      Buffer.from(JSON.stringify(event)),
    );
    return sent;
  }
}
