import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { synchronizePostgres } from '../../common/utils/sync';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from './ormconfig';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { ConversationAutomaticDistributionService } from './services/conversation-automatic-distribution.service';
import { ConversationAutomaticDistributionController } from './controllers/conversation-automatic-distribution-controller';
import { ConversationAutomaticDistribution } from './models/conversation-automatic-distribution.entity';
import { ConversationAutomaticDistributionLog } from './models/conversation-automatic-distribution-log.entity';
import { DistributionRule } from './models/distribution-rule.entity';
import { DistributionRuleService } from './services/distribution-rule.service';
import { DistributorCronService } from './services/distributor-cron.service';
import { ExternalDataService } from './services/external-data.service';
import { ConversationAutomaticDistributionLogService } from './services/conversation-automatic-distribution-log.service';

@Module({
    providers: [
        ConversationAutomaticDistributionService,
        ConversationAutomaticDistributionLogService,
        DistributionRuleService,
        DistributorCronService,
        ExternalDataService,
    ],
    controllers: [ConversationAutomaticDistributionController],
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [ConversationAutomaticDistribution, ConversationAutomaticDistributionLog, DistributionRule],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'conversation_automatic_distribution',
        }),
        TypeOrmModule.forFeature(
            [ConversationAutomaticDistribution, ConversationAutomaticDistributionLog, DistributionRule],
            CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION,
        ),
        ScheduleModule.forRoot(),
    ],
    exports: [],
})
export class ConversationAutomaticDistributionModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ConversationAutomaticDistributionController);
    }
}
