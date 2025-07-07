import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  ActivityType,
  ChannelIdConfig,
  ConversationCloseType,
  IActivityAck,
  IActivityIndexRequestEvent,
  IdentityType,
  IGupshupNumberDontExistsReceivedEvent,
  IUserUpdatedEvent,
  IWhatsAppSessionCountIncrementEvent,
  IWhatswebMessageAck,
  KissbotEvent,
  KissbotEventType,
} from 'kissbot-core';
import * as moment from 'moment';
import { ActivityService } from './activity.service';
import {
  Activity,
  Member,
  Conversation,
  AgentConversationMetrics,
} from 'kissbot-entities';
import { ConversationService } from './conversation.service';
import { MemberService } from './member.service';
import { MetricsInterface } from '../interfaces/metrics.interface';
import { getZeroIfNaN } from '../utils/getZeroIfNan';
import { CatchError } from '../../../../utils/catch-error';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../../utils/get-queue-name';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ANALYTICS_CONNECTION } from '../../consts';
import * as Sentry from '@sentry/node';
import { AgentConversationMetricsService } from './agent-conversation-metrics.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(
    private readonly analyticsv2Service: ActivityService,
    private readonly conversationv2Service: ConversationService,
    private readonly memberService: MemberService,
    private readonly agentConversationMetricsService: AgentConversationMetricsService,
    @InjectConnection(ANALYTICS_CONNECTION)
    private connection: Connection,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
    routingKey: [
      KissbotEventType.ACTIVITY_SENDED,
      KissbotEventType.WHATSWEB_MESSAGE_ACK,
    ],
    queue: getQueueName('analytics-activity-consumer'),
    queueOptions: {
      durable: true,
      channel: AnalyticsService.name + '_ACTIVITY',
    },
  })
  private async processActivity(event: KissbotEvent) {
    try {
      return await this.processEvent(event);
    } catch (e) {
      console.error('processActivity');
      console.error(e);
    }
    return;
  }

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
    routingKey: [
      KissbotEventType.CONVERSATION_METRICS_UPDATED,
      KissbotEventType.CONVERSATION_CLOSED,
      KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
      KissbotEventType.CONVERSATION_CREATED,
      KissbotEventType.CONVERSATION_TAGS_UPDATE,
      KissbotEventType.CONVERSATION_ASSIGNED,
      KissbotEventType.CONVERSATION_UNASSIGNED,
      KissbotEventType.CONVERSATION_SUSPENDED,
      KissbotEventType.CONVERSATION_WHATSAPP_SESSION_COUNT_INCREMENT,
      KissbotEventType.GUPSHUP_NUMBER_DONT_EXISTS_RECEIVED,
      KissbotEventType.USER_UPDATED,
    ],
    queue: getQueueName('analytics-conversation-consumer'),
    queueOptions: {
      durable: true,
      channel: AnalyticsService.name + '_CONVERSATION',
    },
  })
  private async processConversation(event: KissbotEvent) {
    try {
      await this.processEvent(event);
      return;
    } catch (e) {
      console.log('AnalyticsService.processConversation', e);
    }
    return;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshViewConversationRating() {
    if (process.env.ONLY_HTTP) return;
    await this.connection.query(`
            REFRESH MATERIALIZED VIEW analytics.conversation_rating;
        `);
  }

  //@Cron(CronExpression.EVERY_10_MINUTES)
  async refreshViewActivity() {
    await this.connection.query(`
            REFRESH MATERIALIZED VIEW analytics.activity_view;
        `);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async refreshViewConversation() {
    if (process.env.ONLY_HTTP) return;
    const now = moment().valueOf();
    // await this.connection.query(`
    //   SELECT analytics.refresh_conversation_view(extract(epoch from current_timestamp) * 1000);
    // `);
    await this.connection.query(`
      SELECT analytics.refresh_conversation_view_v2(now());
    `);
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async refreshViewInternalAnalytics() {
    if (process.env.ONLY_HTTP) return;
    await this.connection.query(`
            REFRESH MATERIALIZED VIEW internal_analytics.conversation_resume;
        `);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async deleteActivitiesAggOkActivities() {
    if (process.env.ONLY_HTTP) return;
    await this.connection.query(`
      delete from analytics.activity where agg_ok = 1 and search_ok = 1;
    `);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async refreshActivityAggregate() {
    if (process.env.ONLY_HTTP) return;
    try {
      const period = moment.utc().endOf('day').subtract(1, 'day').valueOf();
      await this.connection.query(`
                INSERT INTO analytics.activity_aggregate (conversation_id, workspace_id, bot_id, "type", "name", "timestamp", is_hsm, count)
                SELECT 
                    conversation_id,
                    workspace_id,
                    bot_id,
                    "type",
                    "name",
                    date_trunc('day', to_timestamp(timestamp/1000)),
                    "isHsm",
                    count(case when "isHsm" = 1 and ack > 0 then "isHsm" when "isHsm" = 0 then "isHsm" end)
                FROM analytics.activity WHERE
                    timestamp < ${period} and
                    agg_ok = 0
                GROUP BY
                    conversation_id,
                    workspace_id,
                    bot_id,
                    type,
                    name,
                    date_trunc('day', to_timestamp(timestamp/1000)),
                    "isHsm";
            `);
      await this.connection.query(`
                UPDATE analytics.activity
                SET agg_ok = 1
                WHERE
                    timestamp < ${period} AND
                    agg_ok = 0
            `);
    } catch (e) {
      console.log('refreshActivityAggregate', e);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshActivitySearch(): Promise<void> {
    if (process.env.ONLY_HTTP) {
      return;
    }

    // ON CONFLICT (id) DO NOTHING;

    try {
      const channelsToSearch = [
        ChannelIdConfig.api,
        ChannelIdConfig.gupshup,
        ChannelIdConfig.liveagent,
        ChannelIdConfig.webchat,
        ChannelIdConfig.campaign,
        ChannelIdConfig.whatsapp,
      ].reduce((total, curr, index) => {
        if (index == 0) {
          return `'${curr}'`;
        }
        return `${total},'${curr}'`;
      }, '');
      const now = moment.utc().valueOf();
      await this.connection.query(`
                BEGIN;

                INSERT INTO analytics.activity_search (id, conversation_id, workspace_id, type, text, timestamp, from_type)
                SELECT id,
                    conversation_id,
                    workspace_id,
                    type,
                    to_tsvector('portuguese', unaccent(coalesce(text, ''))),
                    timestamp,
                    from_type
                FROM analytics.activity
                WHERE 
                to_tsvector('portuguese', unaccent(coalesce(text, ''))) <> ''
                AND TIMESTAMP < ${now}
                AND type IN('${ActivityType.message}')
                AND from_channel IN (${channelsToSearch})
                AND from_type IN('${IdentityType.user}',
                                '${IdentityType.agent}')
                AND length(text) > 2
                AND search_ok = 0 ON CONFLICT (id) DO NOTHING;

                UPDATE analytics.activity
                SET search_ok = 1
                WHERE TIMESTAMP < ${now}
                AND search_ok = 0;

                COMMIT;
            `);
    } catch (error) {
      console.log('ActivitySearchService.refreshActivitySearch', error);
      Sentry.captureEvent({
        message: 'ActivitySearchService.refreshActivitySearch',
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  // @CatchError()
  private async processEvent(event: KissbotEvent) {
    const eventData = event.data as any;
    switch (event.type) {
      case KissbotEventType.ACTIVITY_SENDED:
        return await this.handleActivity(event.data);

      case KissbotEventType.ANALYTICS_REINDEX_CONVERSATION_REQUEST:
        return await this.handleReindexConversation(eventData);

      case KissbotEventType.GUPSHUP_NUMBER_DONT_EXISTS_RECEIVED:
        return await this.handleConversationInvalidNumber(eventData);

      case KissbotEventType.CONVERSATION_CREATED:
        return await this.handleConversation(eventData);

      case KissbotEventType.ANALYTICS_INDEX_ACTIVITY_REQUEST:
        return await this.handleActivities(
          eventData as IActivityIndexRequestEvent,
        );

      case KissbotEventType.CONVERSATION_MEMBER_ADDED:
        await this.updateOrCreateAgentConversationMetrics(event?.data);
        return await this.updateMembers(
          (event.data as any).members,
          (event.data as any)._id,
        );

      case KissbotEventType.CONVERSATION_MEMBER_UPDATED:
        return await this.updateMember(event.data);

      case KissbotEventType.CONVERSATION_CLOSED:
        return await this.updateConversationClosed(event.data);

      case KissbotEventType.CONVERSATION_MEMBERS_UPDATED:
        await this.updateOrCreateAgentConversationMetrics(event?.data);
        return await this.updateMembers(
          (eventData as any).members,
          (eventData as any)._id,
        );

      case KissbotEventType.CONVERSATION_TAGS_UPDATE:
        return await this.updateTags(eventData);

      case KissbotEventType.CONVERSATION_ASSIGNED:
      case KissbotEventType.CONVERSATION_UNASSIGNED:
        return await this.conversationv2Service.updateConversationAssigned(
          event.data,
        );

      case KissbotEventType.CONVERSATION_SUSPENDED:
        return await this.conversationv2Service.updateSuspendedUntil(
          event.data,
        );

      case KissbotEventType.WHATSWEB_MESSAGE_ACK:
        return await this.handleActivityAck(event.data as IActivityAck);

      case KissbotEventType.CONVERSATION_METRICS_UPDATED:
        return await this.handleConversationMetricsUpdated(event.data);

      case KissbotEventType.CONVERSATION_WHATSAPP_SESSION_COUNT_INCREMENT:
        return await this.handleConversationWhatsappSessionCountIncrement(
          event.data as IWhatsAppSessionCountIncrementEvent,
        );

      case KissbotEventType.USER_UPDATED:
        return await this.updatedNameMember(event.data as IUserUpdatedEvent);
    }
  }

  private async updatedNameMember(event) {
    return await this.memberService.updateNameMemberByMemberIdAndType(
      event._id,
      event.name,
    );
  }

  private async handleConversationMetricsUpdated(event) {
    const metrics: MetricsInterface = {
      metricsAssignmentAt: getZeroIfNaN(event.metrics.assignmentAt),
      metricsCloseAt: getZeroIfNaN(event.metrics.closeAt),
      metricsLastAgentReplyAt: getZeroIfNaN(event.metrics.lastAgentReplyAt),
      metricsLastUserReplyAt: getZeroIfNaN(event.metrics.lastUserReplyAt),
      metricsMedianTimeToAgentReply: getZeroIfNaN(
        event.metrics.medianTimeToAgentReply,
      ),
      metricsMedianTimeToUserReply: getZeroIfNaN(
        event.metrics.medianTimeToUserReply,
      ),
      metricsTimeToAgentReply: getZeroIfNaN(event.metrics.timeToAgentReply),
      metricsTimeToAssignment: getZeroIfNaN(event.metrics.timeToAssignment),
      metricsFirstAgentReplyAt: getZeroIfNaN(event.metrics.firstAgentReplyAt),
      metricsTimeToClose: getZeroIfNaN(event.metrics.timeToClose),
      metricsTimeToUserReply: getZeroIfNaN(event.metrics.timeToUserReply),
      metricsAwaitingWorkingTime: getZeroIfNaN(
        event.metrics.awaitingWorkingTime,
      ),
      metricsAutomaticDurationAttendance: getZeroIfNaN(
        event.metrics.automaticDurationAttendance,
      ),
      suspendedUntil: getZeroIfNaN(event.suspendedUntil),
      waitingSince: getZeroIfNaN(event.waitingSince),
      order: getZeroIfNaN(event.order),
      priority: getZeroIfNaN(event.priority),
      whatsappExpiration: getZeroIfNaN(event.whatsappExpiration),
    };
    Object.keys(metrics).forEach((key) => {
      if (metrics[key] === undefined || metrics[key] === null) {
        delete metrics[key];
      }
    });
    await this.conversationv2Service.updateMetrics(event._id, metrics);
  }

  @CatchError()
  private async handleConversationWhatsappSessionCountIncrement(
    ev: IWhatsAppSessionCountIncrementEvent,
  ) {
    await this.conversationv2Service.updateSessionCount(
      ev.conversationId,
      ev.whatsappSessionCount,
    );
  }

  private async updateTags({ tags, conversationId }) {
    await this.conversationv2Service.updateTags(
      conversationId,
      (tags || [])
        .filter((tag) => !!tag.name)
        .map((tag) => (tag.name as string).trim()),
    );
  }

  private async updateMembers(members: any[], conversationId: string) {
    await Promise.all(
      (members || []).map(async (member) => {
        const result = await this.memberService.updateConversationMember(
          this.convertMongoMemberToPostgresMember(member, conversationId),
        );
        if (result?.affected == 0) {
          await this.memberService.createMember(
            this.convertMongoMemberToPostgresMember(member, conversationId),
          );
        }
      }),
    );
  }

  private async updateMember(ev) {
    await this.memberService.updateConversationMember(
      this.convertMongoMemberToPostgresMember(ev, ev.conversationId),
    );
  }

  private async updateOrCreateAgentConversationMetrics(conversation: any) {
    try {
      const conversationId = conversation?._id;
      const workspaceId =
        conversation?.workspace?._id || conversation?.workspaceId;
      if (conversationId && workspaceId) {
        const agentMembers = (conversation?.members || [])?.filter(
          (member) => member?.type === 'agent',
        );
        await Promise.all(
          (agentMembers || []).map(async (member) => {
            const data: AgentConversationMetrics = {
              ...new AgentConversationMetrics(),
              conversationId: conversationId,
              workspaceId: workspaceId,
              userId: member.id,
              metricAssumedAt: getZeroIfNaN(member?.metrics?.assumedAt),
            };
            return await this.agentConversationMetricsService.updateOrCreateAgentConversationMetrics(
              data,
            );
          }),
        );
      }
    } catch (e) {
      console.log(
        `${AnalyticsService.name}.updateOrCreateAgentConversationMetrics`,
        e,
      );
      Sentry.captureEvent({
        message: `${AnalyticsService.name}.updateOrCreateAgentConversationMetrics`,
        extra: {
          error: e,
          conversation,
        },
      });
    }
  }

  private async updateConversationClosed(ev) {
    const closeMember = ev.members.find((mem) => mem.id == ev.closedBy);
    let closeType;

    if (ev.closeType) {
      closeType = ev.closeType;
    }
    if (!closeType) {
      if (closeMember.type === 'agent') {
        closeType = ConversationCloseType.agent_finished;
      }
      if (closeMember.type === 'bot') {
        closeType = ConversationCloseType.bot_finished;
      }
      if (closeMember.type === 'system') {
        closeType = ConversationCloseType.expiration;
      }
    }

    if (!closeType) {
      closeType = ConversationCloseType.bot_finished;
    }
    await this.conversationv2Service.updateConversationClosed(
      ev._id,
      ev.closedBy,
      closeType,
    );
  }

  async handleActivityAck(event: IActivityAck) {
    try {
      for (const hash of event.hash) {
        await this.analyticsv2Service.updateActivityAck(
          hash,
          event.ack,
          event.workspaceId,
        );
      }
    } catch (e) {
      console.log('handleActivityAck');
      console.log(e);
    }
  }

  private async handleReindexConversation(event: any[]) {
    for (const conv of event) {
      await this.handleConversation(conv);
    }
  }

  private async handleConversationInvalidNumber(
    event: IGupshupNumberDontExistsReceivedEvent,
  ) {
    await this.conversationv2Service.updateConversationInvalidNumber(
      event.conversationId,
    );
  }

  private async handleActivity(ev) {
    try {
      const activity = this.getAnalyticsActivity(ev);
      if (activity.type === ActivityType.typing) {
        return;
      }
      await this.analyticsv2Service.create(this.getAnalyticsActivity(ev));
    } catch (e) {
      console.log('handleActivity');
      console.log(e);
    }
  }

  private async handleActivities(data: IActivityIndexRequestEvent) {
    const analyticsActivities = data.activities
      .map((acti) =>
        this.getAnalyticsActivity({
          activity: acti,
          conversation: data.conversation,
        }),
      )
      .filter((acti) => acti.type !== ActivityType.typing);
    await this.analyticsv2Service.createBulk(analyticsActivities);
  }

  private getAnalyticsActivity(data: {
    activity: any;
    conversation: any;
  }): Activity {
    // esses replaces abaixo tratam o erro de postgres driverError: error: invalid byte sequence for encoding "UTF8": 0x00
    // Acontece quando uma string tem o seguinte caractere \\u0000 um exemplo real disso é o texto "DEUS É FIEL \\u0000."
    //   que fez esse erro aconter

    try {
      data.activity.text = ((data.activity.text || '') as string).replace(
        /\0/g,
        '',
      );
      if (
        data.activity?.from?.name &&
        typeof data.activity.from.name == 'string'
      ) {
        data.activity.from.name = (
          (data.activity.from.name || '') as string
        ).replace(/\0/g, '');
      }

      let a = JSON.stringify(data.activity);
      a = a.replace(/\0/g, '');
      data.activity = JSON.parse(a);
    } catch (e) {
      console.log(e);
    }

    return {
      ack: data.activity.ack,
      botId: data.activity.botId,
      isHsm: data.activity.isHsm ? 1 : 0,
      name: data.activity.name,
      conversationId: data.activity.conversationId,
      data: null,
      fromChannel: data.activity.from.channelId,
      fromId: data.activity.from.id,
      fromType: data.activity.from.type,
      fromName: data.activity.from.name,
      hash: data.activity.hash,
      id: data.activity?._id || data.activity?.id,
      timestamp: moment.utc(data.activity.timestamp).valueOf(),
      type: data.activity.type,
      workspaceId: data.activity.workspaceId,
      text: data.activity.text,
    };
  }

  private async handleConversation(event) {
    try {
      const conversation: Conversation = {
        ...new Conversation(),
        assignedToTeamId: event.assignedToTeamId,
        assignedToUserId: event.assignedToUserId,
        beforeExpirationTime: event.beforeExpirationTime,
        beforeExpiresAt: event.beforeExpiresAt,
        closedBy: event.closedBy,
        createdByChannel: event.createdByChannel,
        data: event.data,
        expirationTime: event.expirationTime,
        expiresAt: event.expiresAt,
        hash: event.hash,
        id: event._id,
        iid: event.iid,
        order: event.order,
        priority: event.priority,
        state: event.state,
        suspendedUntil: event.suspendedUntil,
        token: event.token,
        waitingSince: event.waitingSince,
        members: (event.members || []).map((member) =>
          this.convertMongoMemberToPostgresMember(member),
        ),
        metricsAssignmentAt: event.metrics?.assignmentAt,
        metricsCloseAt: event.metrics?.closeAt,
        metricsLastAgentReplyAt: event.metrics?.lastAgentReplyAt,
        metricsLastUserReplyAt: event.metrics?.lastUserReplyAt,
        metricsMedianTimeToAgentReply: event.metrics?.medianTimeToAgentReply,
        metricsMedianTimeToUserReply: event.metrics?.medianTimeToUserReply,
        metricsTimeToAgentReply: event.metrics?.timeToAgentReply,
        metricsTimeToAssignment: event.metrics?.timeToAssignment,
        metricsTimeToClose: event.metrics?.timeToClose,
        metricsTimeToUserReply: event.metrics?.timeToUserReply,
        workspaceId: event.workspace._id,
        botId: (event.bot || {})._id,
        tags: (event.tags || [])
          .filter((tag) => !!tag.name)
          .map((tag) => (tag.name as string).trim()),
        referralSourceId: event?.referralSourceId,
        createdAt: moment.utc(event.createdAt).valueOf(),
      };

      await this.conversationv2Service.upsert(conversation);
    } catch (e) {
      console.log('event', event);
      console.log('error', e);
      // throw e;
    }
  }

  private convertMongoMemberToPostgresMember(
    member: any,
    conversationId?: string,
  ) {
    return {
      ...new Member(),
      channelId: member.channelId,
      data: member.data,
      disabled: member.disabled ? 1 : 0,
      memberId: member.id,
      name: member.name,
      type: member.type,
      conversationId,
    } as Member;
  }
}
