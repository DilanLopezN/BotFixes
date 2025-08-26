import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ScheduleController } from './controllers/schedule.controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { ScheduleSettingController } from './controllers/schedule-setting.controller';
import { ExternalController } from './controllers/external.controller';
import { CancelReasonController } from './controllers/cancel-reason.controller';
import { DiagnosticController } from './controllers/diagnostic.controller';
import { ScheduleAnalyticsController } from './controllers/schedule-analytics.controller';
import { AutomaticMessageController } from './automatic-message/automatic-message.controller';
import { AutomaticMessageService } from './automatic-message/automatic-message.service';
import { ExternalDataService } from './services/external-data.service';
import { AgentStatusMiddleware } from '../agent-status/middleware/agent-status.middleware';
@Module({
    imports: [],
    providers: [AutomaticMessageService, ExternalDataService],
    exports: [],
    controllers: [
        ScheduleController,
        ScheduleSettingController,
        ExternalController,
        ScheduleAnalyticsController,
        CancelReasonController,
        DiagnosticController,
        AutomaticMessageController,
    ],
})
export class ScheduleModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                ScheduleSettingController,
                ScheduleController,
                ScheduleAnalyticsController,
                CancelReasonController,
                DiagnosticController,
            );
        consumer.apply(AgentStatusMiddleware).forRoutes(ScheduleAnalyticsController);
    }
}
