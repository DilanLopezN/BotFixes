import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { sanitizeObject } from '../../common/helpers/safe-json.helper';

@Injectable()
export class EventsService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  public async dispatch(eventName: KissbotEventType, data: any) {
    let routingKey: string = eventName;

    if (!routingKey) {
      return;
    }

    // Sanitiza os dados para evitar referências circulares na serialização JSON
    const sanitizedData = sanitizeObject(data);

    return await this.amqpConnection.publish(process.env.EVENT_EXCHANGE_NAME || 'events', routingKey, {
      data: sanitizedData,
      dataType: KissbotEventDataType.ANY,
      source: KissbotEventSource.KISSBOT_INTEGRATIONS,
      type: routingKey,
    });
  }
}
