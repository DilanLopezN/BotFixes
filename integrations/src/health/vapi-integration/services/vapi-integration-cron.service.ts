import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { shouldRunCron } from '../../../common/bootstrap-options';
import { VapiIntegrationService } from './vapi-integration.service';

const VAPI_CRON_ENABLED = 'VAPI_CRON_SEND_MESSAGE_ENABLED';

@Injectable()
export class VapiIntegrationCronService {
  private readonly logger = new Logger(VapiIntegrationCronService.name);

  constructor(private readonly vapiIntegrationService: VapiIntegrationService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendMessageCron() {
    if (!shouldRunCron()) {
      return;
    }
    try {
      const { enqueued } = await this.vapiIntegrationService.enqueuePendingVapiMessages();
      if (enqueued > 0) {
        this.logger.log(`VAPI sendMessage cron enqueued ${enqueued} pending message(s)`);
      }
    } catch (error) {
      this.logger.error('VAPI sendMessage cron failed', error);
    }
  }
}
