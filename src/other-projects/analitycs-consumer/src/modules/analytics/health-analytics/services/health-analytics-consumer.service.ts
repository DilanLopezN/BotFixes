import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { KissbotEvent, KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../../utils/get-queue-name';
import { HealthAnalyticsProcessorService } from './health-analytics-processor.service';

@Injectable()
export class HealthAnalyticsConsumerService {
  private readonly logger = new Logger(HealthAnalyticsConsumerService.name);
  constructor(
    private readonly healthAnalyticsProcessorService: HealthAnalyticsProcessorService,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
    routingKey: [
      KissbotEventType.INTEGRATION_HEALTH_APPOINTMENT_SCHEDULED,
      KissbotEventType.INTEGRATION_HEALTH_APPOINTMENT_STEP,
      KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_WITHOUT_AVAILABILITY,
      KissbotEventType.INTEGRATION_HEALTH_APPOINTMENT_CONFIRMED,
      KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_AVAILABILITY,
      KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_REDIRECTED,
      KissbotEventType.INTEGRATION_HEALTH_APPOINTMENT_CANCELED,
      KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_WITHOUT_ENTITIES,
      KissbotEventType.INTEGRATION_HEALTH_REASON_FOR_NOT_SCHEDULING_CREATED,
    ],
    queue: getQueueName('analytics-health'),
    queueOptions: {
      durable: true,
      channel: HealthAnalyticsConsumerService.name,
    },
  })
  private async consumer(event: KissbotEvent) {
    try {
      const { data, id: eventId } = event as any;

      switch (event.type) {
        case KissbotEventType.INTEGRATION_HEALTH_APPOINTMENT_SCHEDULED: {
          await this.healthAnalyticsProcessorService.processScheduledEvent(
            eventId,
            data,
          );
          break;
        }

        case KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_AVAILABILITY: {
          await this.healthAnalyticsProcessorService.processAppointmentAvailabilityEvent(
            eventId,
            data,
          );
          break;
        }

        case KissbotEventType.INTEGRATION_HEALTH_APPOINTMENT_STEP: {
          await this.healthAnalyticsProcessorService.processAppointmentStepEvent(
            eventId,
            data,
          );
          break;
        }

        case KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_WITHOUT_AVAILABILITY: {
          await this.healthAnalyticsProcessorService.processScheduledWithoutAvailabilityEvent(
            eventId,
            data,
          );
          break;
        }

        case KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_WITHOUT_ENTITIES: {
          await this.healthAnalyticsProcessorService.processScheduledWithoutEntities(
            eventId,
            data,
          );
          break;
        }

        case KissbotEventType.INTEGRATION_HEALTH_SCHEDULING_REDIRECTED: {
          await this.healthAnalyticsProcessorService.processScheduledRedirected(
            eventId,
            data,
          );
          break;
        }

        case KissbotEventType.INTEGRATION_HEALTH_REASON_FOR_NOT_SCHEDULING_CREATED: {
          await this.healthAnalyticsProcessorService.processScheduleReasonCreated(
            eventId,
            data,
          );
          break;
        }

        default: {
          this.logger.debug(`Event ${event.type} processed`);
        }
      }

      return;
    } catch (e) {
      this.logger.error(e);
    }
  }
}
