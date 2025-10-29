import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmtReService } from './smt-re.service';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';

@Injectable()
export class SmtReCronService {
    constructor(private readonly smtReService: SmtReService) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async handleMessageScheduling(): Promise<void> {
        if (!shouldRunCron()) return;
        await this.smtReService.sendPendingSmtRe();
    }
}
