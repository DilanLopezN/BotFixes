import { Injectable, Logger } from '@nestjs/common';
import { ScheduleMessageService } from './schedule-message.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { KissbotEventType } from 'kissbot-core';
import { CacheService } from '../../../cache/cache.service';
import { getQueueName } from '../../../miscellaneous/utils';

@Injectable()
export class ResendConversationClosedConsumerService {
  private readonly logger = new Logger(
    ResendConversationClosedConsumerService.name,
  );

  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
    public cacheService: CacheService,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME,
    routingKey: KissbotEventType.CONVERSATION_CLOSED,
    queue: getQueueName('resend-schedule-message'),
    queueOptions: {
      durable: true,
      channel: ResendConversationClosedConsumerService.name,
      arguments: {
        'x-single-active-consumer': true,
      },
    },
  })
  private async dispatch(event: any) {
    if (typeof event !== 'object' || !event.data) return;

    switch (event.type) {
      case KissbotEventType.CONVERSATION_CLOSED: {
        const { data } = event;
        const resendCacheKey =
          this.scheduleMessageService.getResendOpenConversationCacheKey(
            data._id,
          );
        const client = this.cacheService.getClient();
        const uuid = await client.get(resendCacheKey);
        await client.del(resendCacheKey);
        if (uuid) {
          return await this.scheduleMessageService.resendOpenConversation(uuid);
        }
      }
      default:
        return null;
    }
  }
}
