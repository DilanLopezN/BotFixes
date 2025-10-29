import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmtRe } from '../models/smt-re.entity';
import { CONVERSATION_SMT_RE_READ_CONNECTION_NAME } from '../ormconfig';

export interface SmtReAnalyticsFilter {
    workspaceId: string;
    startDate?: Date;
    endDate?: Date;
    remiIdList?: string[];
}

@Injectable()
export class SmtReAnalyticsService {
    constructor(
        @InjectRepository(SmtRe, CONVERSATION_SMT_RE_READ_CONNECTION_NAME)
        private readonly smtReReadRepository: Repository<SmtRe>,
    ) {}

    async getFunnelAnalytics(filter: SmtReAnalyticsFilter) {
        const baseQuery = this.smtReReadRepository
            .createQueryBuilder('smtRe')
            .where('smtRe.workspaceId = :workspaceId', { workspaceId: filter.workspaceId });

        if (filter.startDate) {
            baseQuery.andWhere('smtRe.createdAt >= :startDate', { startDate: filter.startDate });
        }

        if (filter.endDate) {
            baseQuery.andWhere('smtRe.createdAt <= :endDate', { endDate: filter.endDate });
        }

        const countConversation = await baseQuery
            .clone()
            .select('COUNT(DISTINCT smtRe.conversationId)', 'count')
            .getRawOne();

        const smtReAssumedCount = await baseQuery.clone().select('COUNT(*)', 'count').getRawOne();

        const smtReConvertedInitialMessage = await baseQuery
            .clone()
            .select('COUNT(*)', 'count')
            .andWhere('smtRe.initialMessageSent IS NOT NULL')
            .andWhere('smtRe.automaticMessageSent IS NULL')
            .andWhere('smtRe.finalizationMessageSent IS NULL')
            .andWhere('smtRe.stopped = :stopped', { stopped: true })
            .getRawOne();

        const smtReConvertedAutomaticMessage = await baseQuery
            .clone()
            .select('COUNT(*)', 'count')
            .andWhere('smtRe.initialMessageSent IS NOT NULL')
            .andWhere('smtRe.automaticMessageSent IS NOT NULL')
            .andWhere('smtRe.finalizationMessageSent IS NULL')
            .andWhere('smtRe.stopped = :stopped', { stopped: true })
            .getRawOne();

        const smtReFinalized = await baseQuery
            .clone()
            .select('COUNT(*)', 'count')
            .andWhere('smtRe.initialMessageSent IS NOT NULL')
            .andWhere('smtRe.automaticMessageSent IS NOT NULL')
            .andWhere('smtRe.finalizationMessageSent IS NOT NULL')
            .andWhere('smtRe.stopped = :stopped', { stopped: true })
            .getRawOne();

        return {
            countConversation: parseInt(countConversation.count, 10),
            smtReAssumedCount: parseInt(smtReAssumedCount.count, 10),
            smtReConvertedInitialMessage: parseInt(smtReConvertedInitialMessage.count, 10),
            smtReConvertedAutomaticMessage: parseInt(smtReConvertedAutomaticMessage.count, 10),
            smtReFinalized: parseInt(smtReFinalized.count, 10),
        };
    }

    async getRemiMetrics(filter: SmtReAnalyticsFilter) {
        const qb = this.smtReReadRepository
            .createQueryBuilder('smt_re')
            .select(
                `
            COUNT(*) AS "totalRemiActivation",
            COUNT(*) FILTER (
                WHERE initial_message_sent = TRUE
                  AND automatic_message_sent = FALSE
                  AND finalization_message_sent = FALSE
            ) AS "totalAnsweredOnFirstAttempt",
            COUNT(*) FILTER (
                WHERE automatic_message_sent = TRUE
                  AND finalization_message_sent = FALSE
            ) AS "totalAnsweredOnSecondAttempt",
            COUNT(*) FILTER (
                WHERE finalization_message_sent = TRUE
            ) AS "totalFinishedByRemi",
            (
              (
                COUNT(DISTINCT conversation_id) FILTER (
                    WHERE finalization_message_sent = FALSE
                    AND (
                        (initial_message_sent = TRUE AND automatic_message_sent = FALSE)
                        OR (automatic_message_sent = TRUE AND finalization_message_sent = FALSE)
                    )
                )
              )::decimal
              / NULLIF(COUNT(DISTINCT conversation_id), 0)
            ) * 100 AS "totalRemiConversion",
            COUNT(DISTINCT conversation_id) FILTER (
                WHERE finalization_message_sent = FALSE
                  AND (
                       (initial_message_sent = TRUE AND automatic_message_sent = FALSE)
                    OR (automatic_message_sent = TRUE AND finalization_message_sent = FALSE)
                  )
            ) AS "totalRengagedConversation",
            COUNT(DISTINCT conversation_id) AS "totalRemiConversations"
          `,
            )
            .where('smt_re.workspace_id = :workspaceId', { workspaceId: filter.workspaceId });

        if (filter.startDate) {
            qb.andWhere('smt_re.created_at >= :startDate', { startDate: filter.startDate });
        }

        if (filter.endDate) {
            qb.andWhere('smt_re.created_at <= :endDate', { endDate: filter.endDate });
        }

        if (filter.remiIdList && filter.remiIdList.length > 0) {
            qb.andWhere('smt_re.smt_re_setting_id = ANY(:remiIdList)', { remiIdList: filter.remiIdList });
        }

        return qb.getRawOne();
    }

    async getReport(filter: SmtReAnalyticsFilter) {
        const endDate = filter.endDate || new Date();
        const startDate = filter.startDate || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        const filterWithDates = {
            ...filter,
            startDate,
            endDate,
        };

        const metrics = await this.getRemiMetrics(filterWithDates);

        const totalRemi = parseInt(metrics.totalRemiActivation, 10) || 0;
        const answeredFirst = parseInt(metrics.totalAnsweredOnFirstAttempt, 10) || 0;
        const answeredSecond = parseInt(metrics.totalAnsweredOnSecondAttempt, 10) || 0;
        const finishedNoResponse = parseInt(metrics.totalFinishedByRemi, 10) || 0;
        const reengaged = parseInt(metrics.totalRengagedConversation, 10) || 0;
        const totalConversations = parseInt(metrics.totalRemiConversations, 10) || 0;
        const conversionRate = parseFloat(metrics.totalRemiConversion) || 0;

        return {
            totalRemiActivation: totalRemi,
            totalAnsweredOnFirstAttempt: answeredFirst,
            totalAnsweredOnSecondAttempt: answeredSecond,
            totalFinishedByRemi: finishedNoResponse,
            totalRemiConversion: conversionRate,
            totalRengagedConversation: reengaged,
            totalRemiConversations: totalConversations,
        };
    }
}
