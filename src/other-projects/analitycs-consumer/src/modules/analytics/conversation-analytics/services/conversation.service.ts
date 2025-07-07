import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationCloseType, ConversationStatus } from 'kissbot-core';
import { Repository, LessThanOrEqual } from 'typeorm';
import { MetricsInterface } from '../interfaces/metrics.interface';
import { Conversation } from 'kissbot-entities';
import * as Sentry from '@sentry/node';
import { ANALYTICS_CONNECTION } from '../../consts';
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  constructor(
    @InjectRepository(Conversation, ANALYTICS_CONNECTION)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async upsert(conversation: Conversation) {
    try {
      return await this.conversationRepository.save(conversation);
    } catch (e) {
      if (
        !((e.message || '') as string).includes(
          'duplicate key value violates unique constraint',
        )
      ) {
        console.log(`${ConversationService.name}.upsert`, e);
        Sentry.captureEvent({
          message: `${ConversationService.name}.upsert`,
          extra: {
            error: e,
            conversation,
          },
        });
      } else {
        console.log('Duplicou ConversationService.create');
      }
    }
  }

  async updateSuspendedUntil(ev) {
    try {
      this.conversationRepository.update(
        { id: ev.conversationId },
        { suspendedUntil: ev.until },
      );
    } catch (e) {
      console.log(`${ConversationService.name}.updateSuspendedUntil`, e);
      Sentry.captureEvent({
        message: `${ConversationService.name}.updateSuspendedUntil`,
        extra: {
          error: e,
          ev,
        },
      });
    }
  }

  async updateTags(id: string, tags: string) {
    try {
      this.conversationRepository.update({ id }, { tags, refreshOk: 0 });
    } catch (e) {
      console.log(`${ConversationService.name}.updateTags`, e);
      Sentry.captureEvent({
        message: `${ConversationService.name}.updateTags`,
        extra: {
          error: e,
          id,
          tags,
        },
      });
    }
  }

  async updateMetrics(id: string, metrics: MetricsInterface) {
    try {
      if (
        Object.keys(metrics).length == 5 &&
        Object.keys(metrics).includes('suspendedUntil') &&
        Object.keys(metrics).includes('waitingSince') &&
        Object.keys(metrics).includes('order') &&
        Object.keys(metrics).includes('priority') &&
        Object.keys(metrics).includes('whatsappExpiration')
      ) {
        const query = this.conversationRepository
          .createQueryBuilder()
          .update()
          .set({
            suspendedUntil: metrics.suspendedUntil,
            waitingSince: metrics.waitingSince,
            order: metrics.order,
            priority: metrics.priority,
            whatsappExpiration: metrics.whatsappExpiration,
          })
          .andWhere('id = :id', { id })
          .andWhere(
            '(COALESCE(suspended_until, 0) <> :suspendedUntil OR COALESCE(waiting_since, 0) <> :waitingSince OR COALESCE(order, 0) <> :order OR COALESCE(priority, 0) <> :priority OR COALESCE(whatsapp_expiration, 0) <> :whatsappExpiration)',
            {
              suspendedUntil: metrics.suspendedUntil,
              waitingSince: metrics.waitingSince,
              order: metrics.order,
              priority: metrics.priority,
              whatsappExpiration: metrics.whatsappExpiration,
            },
          );
        await query.execute();
      } else {
        await this.conversationRepository.update(
          { id },
          {
            ...(metrics as Partial<Conversation>),
          },
        );
      }
    } catch (e) {
      console.log(`${ConversationService.name}.updateMetrics`, e);
      Sentry.captureEvent({
        message: `${ConversationService.name}.updateMetrics`,
        extra: {
          error: e,
          id,
          metrics,
        },
      });
    }
  }

  async updateSessionCount(id: string, sessionCount: number) {
    try {
      await this.conversationRepository.update(
        {
          id,
          // whatsappSessionCount: LessThan(sessionCount)
        },
        {
          whatsappSessionCount: sessionCount,
        },
      );
    } catch (e) {
      console.log(`${ConversationService.name}.updateSessionCount`, e);
      Sentry.captureEvent({
        message: `${ConversationService.name}.updateSessionCount`,
        extra: {
          error: e,
          id,
          sessionCount,
        },
      });
    }
  }

  async updateConversationClosed(
    id: string,
    closedBy: string,
    closeType: ConversationCloseType,
  ) {
    try {
      await this.conversationRepository.update(
        { id },
        {
          state: ConversationStatus.closed,
          closedBy,
          refreshOk: 0,
          expiresAt: 0,
          beforeExpiresAt: 0,
          expirationTime: 0,
          beforeExpirationTime: 0,
          closeType,
        },
      );
    } catch (e) {
      console.log(`${ConversationService.name}.updateConversationClosed`, e);
      Sentry.captureEvent({
        message: `${ConversationService.name}.updateConversationClosed`,
        extra: {
          error: e,
          id,
          closedBy,
          closeType,
        },
      });
    }
  }

  async updateConversationAssigned(ev) {
    try {
      await this.conversationRepository.update(
        { id: ev.conversationId },
        {
          assignedToUserId: ev.userId,
          assignedToTeamId: ev.team._id,
          priority: ev.priority,
          refreshOk: 0,
        },
      );
    } catch (e) {
      console.log(`${ConversationService.name}.updateConversationAssigned`, e);
      Sentry.captureEvent({
        message: `${ConversationService.name}.updateConversationAssigned`,
        extra: {
          error: e,
          ev,
        },
      });
    }
  }

  async updateConversationInvalidNumber(conversationId: string) {
    try {
      await this.conversationRepository.update(
        { id: conversationId },
        {
          invalidNumber: true,
        },
      );
    } catch (e) {
      console.log(
        `${ConversationService.name}.updateConversationInvalidNumber`,
        e,
      );
      Sentry.captureEvent({
        message: `${ConversationService.name}.updateConversationInvalidNumber`,
        extra: {
          error: e,
          conversationId,
        },
      });
    }
  }

  async updateRefreshView(timestamp: number) {
    try {
      await this.conversationRepository.update(
        { refreshOk: 0, createdAt: LessThanOrEqual(timestamp) },
        {
          refreshOk: 1,
        },
      );
    } catch (e) {
      console.log('ConversationService.updateRefreshView', e);
    }
  }
}
