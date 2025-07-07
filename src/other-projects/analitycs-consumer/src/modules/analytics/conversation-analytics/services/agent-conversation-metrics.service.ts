import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentConversationMetrics } from 'kissbot-entities';
import { Repository } from 'typeorm';
import { ANALYTICS_CONNECTION } from '../../consts';
import * as Sentry from '@sentry/node';

@Injectable()
export class AgentConversationMetricsService {
  private readonly logger = new Logger(AgentConversationMetricsService.name);
  constructor(
    @InjectRepository(AgentConversationMetrics, ANALYTICS_CONNECTION)
    private agentConversationMetricsRepository: Repository<AgentConversationMetrics>,
  ) {}

  async updateOrCreateAgentConversationMetrics(data: AgentConversationMetrics) {
    try {
      if (!data.userId || !data.conversationId || !data.workspaceId) {
        return;
      }
      const record = await this.agentConversationMetricsRepository.findOne({
        where: {
          workspaceId: data.workspaceId,
          conversationId: data.conversationId,
          userId: data.userId,
        },
      });

      if (record) {
        return await this.agentConversationMetricsRepository.update(
          {
            workspaceId: data.workspaceId,
            conversationId: data.conversationId,
            userId: data.userId,
          },
          {
            metricAssumedAt: data.metricAssumedAt,
          },
        );
      } else {
        return await this.createAgentConversationMetrics(data);
      }
    } catch (e) {
      console.log(
        `${AgentConversationMetricsService.name}.updateOrCreateAgentConversationMetrics`,
        e,
      );
      Sentry.captureEvent({
        message: `${AgentConversationMetricsService.name}.updateOrCreateAgentConversationMetrics`,
        extra: {
          error: e,
          data,
        },
      });
    }
  }

  async createAgentConversationMetrics(data: AgentConversationMetrics) {
    try {
      if (!data.userId || !data.conversationId || !data.workspaceId) {
        return;
      }
      return await this.agentConversationMetricsRepository.insert(data);
    } catch (e) {
      console.log(`${AgentConversationMetricsService.name}.createMember`, e);
      Sentry.captureEvent({
        message: `${AgentConversationMetricsService.name}.createMember`,
        extra: {
          error: e,
          data,
        },
      });
    }
  }
}
