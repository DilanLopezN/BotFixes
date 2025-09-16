import { Injectable, Logger } from '@nestjs/common';
import { ScheduleMessageService } from './schedule-message.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { KissbotEventType } from 'kissbot-core';
import { ScheduleMessageResponseType } from '../../models/schedule-message.entity';
import { CacheService } from '../../../cache/cache.service';
import { getQueueName } from '../../../miscellaneous/utils';

@Injectable()
export class SchedulingConfirmationConsumerService {
  private readonly logger = new Logger(
    SchedulingConfirmationConsumerService.name,
  );

  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
    public cacheService: CacheService,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME,
    routingKey: [
      KissbotEventType.SCHEDULING_CONFIRMATION_CONFIRMED,
      KissbotEventType.SCHEDULING_CONFIRMATION_CANCELED,
    ],
    queue: getQueueName('scheduling-confirmation'),
    queueOptions: {
      durable: true,
      channel: SchedulingConfirmationConsumerService.name,
      arguments: {
        'x-single-active-consumer': true,
      },
    },
  })
  private async dispatch(event: any) {
    try {
      if (typeof event !== 'object' || !event.data) return;

      switch (event.type) {
        case KissbotEventType.SCHEDULING_CONFIRMATION_CANCELED:
        case KissbotEventType.SCHEDULING_CONFIRMATION_CONFIRMED: {
          const { data, type } = event;

          if (data.integrationId && data.scheduleId) {
            const { integrationId, scheduleId } = data;
            let responseType = null;

            if (type == KissbotEventType.SCHEDULING_CONFIRMATION_CANCELED) {
              responseType = ScheduleMessageResponseType.canceled;
            } else if (
              type == KissbotEventType.SCHEDULING_CONFIRMATION_CONFIRMED
            ) {
              responseType = ScheduleMessageResponseType.confirmed;
            }

            return await this.scheduleMessageService.updateScheduleMessageTypeEmail(
              integrationId,
              scheduleId,
              responseType,
            );
          }
          return null;
        }
        default:
          return null;
      }
    } catch (error) {
      console.error('ERROR SchedulingConfirmationConsumerService: ', error);
    }
  }
}
