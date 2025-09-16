import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import {
  SCHEDULE_CONNECTION_NAME,
  SCHEDULE_READ_CONNECTION_NAME,
} from './connName';
import { ConfirmationSetting } from './models/confirmation-setting.entity';
import { Schedule } from './models/schedule.entity';
import { ExtractResume } from './models/extract-resume.entity';
import { ScheduleService } from './services/schedule/schedule.service';
import { IntegrationApiService } from './services/integration-api.service';
import { ScheduleSetting } from './models/schedule-setting.entity';
import { ConfirmationSettingService } from './services/confirmation/confirmation-setting.service';
import { ExtractResumeService } from './services/extract/extract-resume.service';
import { ScheduleSettingService } from './services/schedule/schedule-setting.service';
import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleSettingController } from './controllers/schedule-setting.controller';
import { ConfirmationSettingController } from './controllers/confirmation-setting.controller';
import { ExternalController } from './controllers/external.controller';
import { CalendarService } from './services/extract/calendar.service';
import { ScheduleMessage } from './models/schedule-message.entity';
import { ScheduleMessageService } from './services/schedule-message/schedule-message.service';
import { SendScheduleMessageService } from './services/schedule-message/send-schedule-message.service';
import { ScheduleMessageResponseConsumerService } from './services/schedule-message/schedule-message-response-consumer.service';
import { ReminderSetting } from './models/reminder-setting.entity';
import { ReminderSettingService } from './services/reminder/reminder-setting.service';
import { ReminderSettingController } from './controllers/reminder-setting.controller';
import { RunExtractResumeService } from './services/extract/run-extract-resume.service';
import { ExtractScheduleConsumerService } from './services/extract/extract-schedule-consumer';
import { ScheduleAnalyticsController } from './schedule-analytics/controllers/schedule-analytics.controller';
import { ScheduleAnalyticsService } from './schedule-analytics/services/schedule-analytics.service';
import { ExternalDataService } from './services/external-data.service';
import { SendSetting } from './models/send-setting.entity';
import { SendSettingService } from './services/send-settings/send-setting.service';
import { ActiveMessageCreatedConsumerService } from './services/schedule-message/active-message-created-consumer.service';
import { RetrySaveIntegrationResponse } from './services/schedule-message/retry-save-integrations.service';
import { ResendNotAnsweredService } from './services/schedule-message/resend-not-answered.service';
import { ScheduleHealthCheckService } from './services/schedule-health-check.service';
import { ResendConversationClosedConsumerService } from './services/schedule-message/resend-conversation-closed-consumer.service';
import { ScheduleStatusEmailConsumerService } from './services/schedule-message/schedule-status-email-consumer.service';
import { CancelReason } from './models/cancel-reason.entity';
import { CancelReasonService } from './services/cancel-reason/cancel-reason.service';
import { CancelReasonController } from './controllers/cancel-reason.controller';
import { SchedulingConfirmationConsumerService } from './services/schedule-message/scheduling-confirmation-consumer.service';
import { SendActiveScheduleIncomingService } from './services/external-incoming/send-active-schedule-incoming.service';
import { SendActiveScheduleConsumerService } from './services/external-incoming/send-active-schedule-consumer';
import { SendActiveScheduleIncomingData } from './models/send-active-schedule-data.entity';
import { DiagnosticService } from './services/diagnostic/diagnostic.service';
import { DiagnosticController } from './controllers/diagnostic.controller';
import { CacheModule } from '../cache/cache.module';
import { ScheduleMessageProcessResponseTypeService } from './services/schedule-message/schedule-message-process-response-type.service';
@Module({
  imports: [
    EventsModule,
    CacheModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      name: SCHEDULE_CONNECTION_NAME,
      url: process.env.POSTGRESQL_URI + '?uuidExtension=pgcrypto',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      migrationsRun: false,
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      schema: 'schedule',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      name: SCHEDULE_READ_CONNECTION_NAME,
      url: process.env.POSTGRESQL_READ_URI + '?uuidExtension=pgcrypto',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      migrationsRun: false,
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      schema: 'schedule',
    }),
    TypeOrmModule.forFeature(
      [
        ConfirmationSetting,
        ReminderSetting,
        ExtractResume,
        Schedule,
        ScheduleSetting,
        ScheduleMessage,
        ReminderSetting,
        SendSetting,
        CancelReason,
        SendActiveScheduleIncomingData,
      ],
      SCHEDULE_CONNECTION_NAME,
    ),
    TypeOrmModule.forFeature(
      [
        ConfirmationSetting,
        ReminderSetting,
        ExtractResume,
        Schedule,
        ScheduleSetting,
        ScheduleMessage,
        ReminderSetting,
        SendSetting,
      ],
      SCHEDULE_READ_CONNECTION_NAME,
    ),
    HttpModule.register({
      timeout: 30000,
      baseURL: process.env.INTEGRATIONS_URI,
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    }),
  ],
  providers: [
    ScheduleService,
    IntegrationApiService,
    ConfirmationSettingService,
    ExtractResumeService,
    ScheduleSettingService,
    CalendarService,
    ScheduleMessageService,
    SendScheduleMessageService,
    ScheduleMessageResponseConsumerService,
    ReminderSettingService,
    RunExtractResumeService,
    ExtractScheduleConsumerService,
    ScheduleAnalyticsService,
    ExternalDataService,
    SendSettingService,
    ActiveMessageCreatedConsumerService,
    RetrySaveIntegrationResponse,
    ResendNotAnsweredService,
    ScheduleHealthCheckService,
    ResendConversationClosedConsumerService,
    ScheduleStatusEmailConsumerService,
    CancelReasonService,
    SchedulingConfirmationConsumerService,
    SendActiveScheduleIncomingService,
    SendActiveScheduleConsumerService,
    DiagnosticService,
    ScheduleMessageProcessResponseTypeService,
  ],
  exports: [CancelReasonService, ScheduleMessageService],
  controllers: [
    ScheduleController,
    ScheduleSettingController,
    ConfirmationSettingController,
    ReminderSettingController,
    ExternalController,
    ScheduleAnalyticsController,
    CancelReasonController,
    DiagnosticController,
  ],
})
export class BDScheduleModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer
    // .apply(AuthMiddleware)
    // .forRoutes(
    //   ExtractResumeController,
    //   ScheduleSettingController,
    //   ConfirmationSettingController,
    //   ReminderSettingController,
    //   ScheduleController,
    //   ScheduleAnalyticsController,
    //   SendSettingController,
    //   CancelReasonController,
    //   DiagnosticController,
    // );
  }
}
