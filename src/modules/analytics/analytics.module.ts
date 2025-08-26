import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    Activity,
    ActivityAggregate,
    Conversation,
    Member,
    ConversationRatingView,
    ConversationView,
    ActivityView,
    Fallback,
    Appointment,
    ConversationSearch,
    ContactSearch,
    ConversationCategorizationView,
    AgentConversationMetrics,
    TeamTime,
} from 'kissbot-entities';
import { ConfigModule } from './../../config/config.module';
import { ConversationAnalyticsModule } from './conversation-analytics/conversation-analytics.module';
import { FallbackModule } from './fallback/fallback.module';
import { HealthAnalyticsModule } from './health-analytics/health-analytics.module';
import { InternalAnalyticsModule } from './internal-analytics/internal-analytics.module';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from './ormconfig';
import { SearchModule } from './search/search.module';
import { synchronizePostgres } from '../../common/utils/sync';
@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: ANALYTICS_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [
                __dirname + '/**/*.entity{.ts,.js}',
                Activity,
                Conversation,
                Member,
                ActivityAggregate,
                ConversationRatingView,
                ConversationCategorizationView,
                ConversationView,
                ActivityView,
                Fallback,
                Appointment,
                AgentConversationMetrics,
                TeamTime,
            ],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'analytics',
            extra: {
                min: 2,
            },
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: ANALYTICS_READ_CONNECTION,
            url: process.env.POSTGRESQL_READ_URI,
            entities: [
                __dirname + '/**/*.entity{.ts,.js}',
                Activity,
                Conversation,
                Member,
                ActivityAggregate,
                ConversationRatingView,
                ConversationCategorizationView,
                ConversationView,
                ActivityView,
                Fallback,
                Appointment,
                Conversation,
                ConversationSearch,
                ContactSearch,
                AgentConversationMetrics,
            ],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'analytics',
        }),
        ConversationAnalyticsModule,
        HealthAnalyticsModule,
        SearchModule,
        FallbackModule,
        InternalAnalyticsModule,
    ],
    exports: [SearchModule, ConversationAnalyticsModule],
})
export class AnalyticsModule {}
