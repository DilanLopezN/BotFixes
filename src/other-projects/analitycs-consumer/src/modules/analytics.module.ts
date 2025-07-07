import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Activity,
  ActivityAggregate,
  ActivityView,
  AgentConversationMetrics,
  Appointment,
  ContactSearch,
  Conversation,
  ConversationFlow,
  ConversationRatingView,
  ConversationSearch,
  ConversationView,
  Fallback,
  Member,
} from 'kissbot-entities';
import { ANALYTICS_CONNECTION } from './analytics/consts';
import { ContactSearchModule } from './analytics/contact-search/contact-search.module';
import { ConversationAnalyticsModule } from './analytics/conversation-analytics/conversation-analytics.module';
import { ConversationFlowModule } from './analytics/conversation-flow/conversation-flow.module';
import { ConversationSearchModule } from './analytics/conversation-search/conversation-search.module';
import { FallbackModule } from './analytics/fallback/fallback.module';
import { HealthAnalyticsModule } from './analytics/health-analytics/health-analytics.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      name: ANALYTICS_CONNECTION,
      url: process.env.POSTGRESQL_URI,
      schema: 'analytics',
      entities: [
        Conversation,
        ActivityAggregate,
        Activity,
        Member,
        ConversationView,
        ConversationRatingView,
        ActivityView,
        Fallback,
        Appointment,
        ConversationSearch,
        ContactSearch,
        ConversationFlow,
        AgentConversationMetrics,
      ],
    }),
    ConversationAnalyticsModule,
    FallbackModule,
    HealthAnalyticsModule,
    ConversationSearchModule,
    ContactSearchModule,
    ConversationFlowModule,
  ],
  providers: [],
})
export class AnalyticsModule {}
