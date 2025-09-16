import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduleMessageService } from './schedule-message.service';
import { shouldRunCron } from '../../../miscellaneous/utils';

@Injectable()
export class ResendNotAnsweredService {
  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  private async resendMessageConfirmationNotAnswered() {
    if (!shouldRunCron()) return;
    this.scheduleMessageService.resendMessageConfirmationNotAnswered();
  }
}
