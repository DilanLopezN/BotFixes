import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SmtReSettingController } from './controllers/smt-re-setting.controller';
import { SmtReAnalyticsController } from './controllers/smt-re-analytics.controller';
import { SmtReController } from './controllers/smt-re.controller';
import { SmtReService } from './services/smt-re.service';
import { SmtReSettingService } from './services/smt-re-setting.service';
import { SmtReCronService } from './services/smt-re-cron.service';
import { SmtReAnalyticsService } from './services/smt-re-analytics.service';
import { ExternalDataService } from './services/external-data.service';
import { CONVERSATION_SMT_RE_CONNECTION_NAME } from './ormconfig';
import { synchronizePostgres } from '../../common/utils/sync';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { SmtRe } from './models/smt-re.entity';
import { SmtReSetting } from './models/smt-re-setting.entity';
import { ConversationClosedConsumerService } from './services/conversation-closed-consumer.service';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CONVERSATION_SMT_RE_CONNECTION_NAME,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'conversation_smart_reengagement',
        }),
        TypeOrmModule.forFeature([SmtRe, SmtReSetting], CONVERSATION_SMT_RE_CONNECTION_NAME),
        ScheduleModule.forRoot(),
    ],
    controllers: [SmtReSettingController, SmtReAnalyticsController, SmtReController],
    providers: [
        SmtReService,
        SmtReSettingService,
        SmtReCronService,
        SmtReAnalyticsService,
        ExternalDataService,
        ConversationClosedConsumerService,
    ],
    exports: [SmtReService, SmtReSettingService],
})
export class ConversationSmtReModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(SmtReSettingController, SmtReAnalyticsController, SmtReController);
    }
}
