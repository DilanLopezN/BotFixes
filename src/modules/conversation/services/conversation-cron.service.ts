import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConversationService } from './conversation.service';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';

@Injectable()
export class ConversationCronService {
    constructor(private readonly conversationService: ConversationService) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCronExpires() {
        if (!shouldRunCron()) return;
        await this.conversationService.finishExpiredConversation();
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCronBeforeExpires() {
        if (!shouldRunCron()) return;
        await this.conversationService.beforeExpireConversation();
    }

    // @Cron(CronExpression.EVERY_DAY_AT_1AM)
    // async handleCronCloseWebemulator() {
    //     if (!shouldRunCron()) return;
    //     await this.conversationService.handleCronCloseWebemulator();
    // }
}
