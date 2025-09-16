import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduleMessageService } from './schedule-message.service';
import { shouldRunCron } from '../../../miscellaneous/utils';

@Injectable()
export class RetrySaveIntegrationResponse {
  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async retry() {
    if (!shouldRunCron()) return;
    this.scheduleMessageService.retrySaveIntegrations();
  }
}
