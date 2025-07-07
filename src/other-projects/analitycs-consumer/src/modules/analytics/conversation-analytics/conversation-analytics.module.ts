import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ActivityService } from './services/activity.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './services/analytics.service';
import { ConversationService } from './services/conversation.service';
import { MemberService } from './services/member.service';
import {
  Conversation,
  ActivityAggregate,
  Activity,
  Member,
  ConversationView,
  ConversationRatingView,
  AgentConversationMetrics,
} from 'kissbot-entities';
import { ANALYTICS_CONNECTION } from '../consts';
import { AgentConversationMetricsService } from './services/agent-conversation-metrics.service';

@Module({
  providers: [
    ActivityService,
    ConversationService,
    AnalyticsService,
    MemberService,
    AgentConversationMetricsService,
  ],
  controllers: [],
  imports: [
    TypeOrmModule.forFeature(
      [
        Activity,
        ActivityAggregate,
        Conversation,
        Member,
        ConversationView,
        ConversationRatingView,
        AgentConversationMetrics,
      ],
      ANALYTICS_CONNECTION,
    ),
  ],
  exports: [ActivityService],
})
export class ConversationAnalyticsModule {}
