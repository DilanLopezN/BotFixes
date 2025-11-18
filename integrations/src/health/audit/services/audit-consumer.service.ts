import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import { KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../common/queue-name';
import { CreateAuditDefault } from '../audit.interface';

@Injectable()
export class AuditConsumerService {
  private readonly logger = new Logger(AuditConsumerService.name);
  constructor(private readonly auditService: AuditService) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME,
    routingKey: [KissbotEventType.INTEGRATION_HEALTH_CREATE_AUDIT],
    queue: getQueueName('audit'),
    queueOptions: {
      durable: true,
      arguments: {
        'x-single-active-consumer': true,
      },
      channel: AuditConsumerService.name,
    },
  })
  async processAuditLogs(event: any): Promise<void> {
    try {
      const data: CreateAuditDefault = event.data as CreateAuditDefault;
      await this.auditService.queueAudits(data as CreateAuditDefault);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
