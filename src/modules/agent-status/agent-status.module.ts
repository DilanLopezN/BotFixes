import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AGENT_STATUS_CONNECTION } from './ormconfig';
import { synchronizePostgres } from '../../common/utils/sync';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { BreakSetting } from './models/break-setting.entity';
import { GeneralBreakSetting } from './models/general-break-setting.entity';
import { WorkingTime } from './models/working-time.entity';
import { BreakSettingService } from './services/break-setting.service';
import { GeneralBreakSettingService } from './services/general-break-setting.service';
import { WorkingTimeService } from './services/working-time.service';
import { BreakSettingController } from './controllers/break-setting.controller';
import { GeneralBreakSettingController } from './controllers/general-break-setting.controller';
import { WorkingTimeController } from './controllers/working-time.controller';
import { ConfigModule } from '../../config/config.module';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '../_core/cache/cache.module';
import { AgentStatusAnalyticsService } from './agent-status-analytics/service/agent-status-analytics.service';
import { ExternalDataService } from './agent-status-analytics/service/external-data.service';
import { AgentStatusAnalyticsController } from './agent-status-analytics/controller/agent-status-analytics.controller';
import { ExternalDataAgentStatusService } from './services/external-data.service';
import { AgentStatusConsumerService } from './services/agent-status-consumer.service';
import { ZSetEventManagerService } from './services/zset-event-manager.service';
import { ZSetEventConsumerService } from './services/zset-event-consumer.service';
import { EventsModule } from '../events/events.module';

@Module({
    controllers: [
        BreakSettingController,
        GeneralBreakSettingController,
        WorkingTimeController,
        AgentStatusAnalyticsController,
    ],
    providers: [
        BreakSettingService,
        GeneralBreakSettingService,
        WorkingTimeService,
        AgentStatusConsumerService,
        AgentStatusAnalyticsService,
        ExternalDataService,
        ExternalDataAgentStatusService,
        ZSetEventManagerService,
        ZSetEventConsumerService,
    ],
    imports: [
        ConfigModule,
        HttpModule,
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: AGENT_STATUS_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'agent_status',
        }),
        TypeOrmModule.forFeature([BreakSetting, GeneralBreakSetting, WorkingTime], AGENT_STATUS_CONNECTION),
        CacheModule,
        EventsModule,
    ],
    exports: [],
})
export class AgentStatusModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                BreakSettingController,
                GeneralBreakSettingController,
                WorkingTimeController,
                AgentStatusAnalyticsController,
            );
    }
}
