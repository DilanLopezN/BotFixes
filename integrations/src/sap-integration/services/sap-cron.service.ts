import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { shouldRunCron } from 'common/bootstrap-options';
import { SapService } from './sap.service';

@Injectable()
export class SapCronService {
  constructor(private readonly sapService: SapService) {}

  @Cron('0 30 7,14 * * *')
  async runCron() {
    if (!shouldRunCron()) {
      return;
    }
    await this.sapService.getAwsFiles();
  }

  @Cron('0 0 12 * * *')
  async sendMessagesCron() {
    if (!shouldRunCron()) {
      return;
    }
    return this.sapService.sendUserMessages();
  }
}
