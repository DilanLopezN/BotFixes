import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ActivityService } from './services/activity.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../../events/events.module';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { ConversationService } from './services/conversation.service';
import { AnalyticsUtilService } from './services/analytics-util.service';
import { MemberService } from './services/member.service';
import {
    ConversationRatingView,
    ConversationView,
    ActivityView,
    Activity,
    ActivityAggregate,
    Member,
    Conversation,
    ConversationCategorizationView,
    AgentConversationMetrics,
} from 'kissbot-entities';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../ormconfig';
import { DashboardTemplateModule } from '../dashboard-template/dashboard-template.module';
import { AnalyticsReadHealthCheckService } from './services/analytics-read-health-check.service';
import { AnalyticsHealthCheckService } from './services/analytics-health-check.service';
import { AgentConversationMetricsService } from './services/agent-conversation-metrics.service';
import { ExternalDataService } from './services/external-data.service';
import { AgentStatusMiddleware } from '../../agent-status/middleware/agent-status.middleware';
import { ConversationAppointmentService } from './services/conversation-appointment.service';

@Module({
    providers: [
        EventsModule,
        ActivityService,
        ConversationService,
        AnalyticsUtilService,
        MemberService,
        AnalyticsReadHealthCheckService,
        AnalyticsHealthCheckService,
        AgentConversationMetricsService,
        ExternalDataService,
        ConversationAppointmentService,
    ],
    controllers: [AnalyticsController],
    imports: [
        EventsModule,
        DashboardTemplateModule,
        TypeOrmModule.forFeature(
            [
                Activity,
                ActivityAggregate,
                Conversation,
                Member,
                ActivityView,
                ConversationView,
                ConversationRatingView,
                ConversationCategorizationView,
                AgentConversationMetrics,
            ],
            ANALYTICS_CONNECTION,
        ),
        TypeOrmModule.forFeature(
            [
                Activity,
                ActivityAggregate,
                Conversation,
                Member,
                ActivityView,
                ConversationView,
                ConversationRatingView,
                ConversationCategorizationView,
                AgentConversationMetrics,
            ],
            ANALYTICS_READ_CONNECTION,
        ),
    ],
    exports: [ActivityService],
})
export class ConversationAnalyticsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(AnalyticsController);
    }
}
