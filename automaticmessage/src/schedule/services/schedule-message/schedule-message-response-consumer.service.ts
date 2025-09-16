import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { KissbotEventType } from 'kissbot-core';
import { ScheduleMessageService } from './schedule-message.service';
import { getQueueName } from '../../../miscellaneous/utils';
import { ScheduleMessageProcessResponseTypeService } from './schedule-message-process-response-type.service';

@Injectable()
export class ScheduleMessageResponseConsumerService {
  private readonly logger = new Logger(
    ScheduleMessageResponseConsumerService.name,
  );

  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
    private readonly scheduleMessageProcessResponseTypeService: ScheduleMessageProcessResponseTypeService,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME,
    routingKey: [
      KissbotEventType.ACTIVE_MESSAGE_USER_ANSWERED,
      KissbotEventType.ACTIVE_MESSAGE_USER_RECEIVED,
      KissbotEventType.ACTIVE_MESSAGE_USER_READ,
      KissbotEventType.ACTIVE_MESSAGE_STATUS_CHANGED,
      KissbotEventType.SCHEDULE_CONFIRMATION_CANCEL_REASON,
      KissbotEventType.SCHEDULE_NPS_SCORE,
      KissbotEventType.SCHEDULE_NPS_SCORE_COMMENT,
    ],
    queue: getQueueName('schedule-message-response'),
    queueOptions: {
      durable: true,
      arguments: {
        'x-single-active-consumer': true,
      },
      channel: ScheduleMessageResponseConsumerService.name,
    },
  })
  private async consume(event: any) {
    try {
      switch (event.type) {
        case KissbotEventType.ACTIVE_MESSAGE_USER_ANSWERED: {
          await this.scheduleMessageService.updateScheduleMessageAnsweredAt(
            event.data.externalId,
            event.data.answeredAt,
          );
          break;
        }
        case KissbotEventType.ACTIVE_MESSAGE_USER_READ: {
          await this.scheduleMessageService.updateScheduleMessageReadAt(
            event.data.externalId,
            event.data.readAt,
          );
          break;
        }
        case KissbotEventType.ACTIVE_MESSAGE_USER_RECEIVED: {
          await this.scheduleMessageService.updateScheduleMessageReceivedAt(
            event.data.externalId,
            event.data.receivedAt,
          );
          break;
        }
        case KissbotEventType.ACTIVE_MESSAGE_STATUS_CHANGED: {
          await this.scheduleMessageProcessResponseTypeService.updateScheduleMessageResponse(
            event.data,
          );
          break;
        }
        case KissbotEventType.SCHEDULE_CONFIRMATION_CANCEL_REASON: {
          const { scheduleId, reasonId, workspaceId } = event.data;

          if (scheduleId && workspaceId && reasonId) {
            await this.scheduleMessageService.updateScheduleMessageCancelReason(
              workspaceId,
              scheduleId,
              reasonId,
            );
          }
          break;
        }
        case KissbotEventType.SCHEDULE_NPS_SCORE: {
          const { scheduleId, npsScore, workspaceId, externalId } = event.data;

          if (scheduleId && workspaceId && (npsScore >= 0 || npsScore <= 10)) {
            await this.scheduleMessageService.updateScheduleMessageNpsScore(
              workspaceId,
              scheduleId,
              npsScore,
              externalId,
            );
          }
          break;
        }
        case KissbotEventType.SCHEDULE_NPS_SCORE_COMMENT: {
          const { scheduleId, npsScoreComment, workspaceId, externalId } =
            event.data;
          await this.scheduleMessageService.updateScheduleMessageNpsScoreComment(
            workspaceId,
            scheduleId,
            npsScoreComment,
            externalId,
          );
          break;
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}
