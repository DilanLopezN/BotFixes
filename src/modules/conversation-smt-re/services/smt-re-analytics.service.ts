import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmtRe } from '../models/smt-re.entity';
import { CONVERSATION_SMT_RE_CONNECTION_NAME } from '../ormconfig';

export interface SmtReAnalyticsFilter {
    workspaceId: string;
    startDate?: Date;
    endDate?: Date;
}

@Injectable()
export class SmtReAnalyticsService {
    constructor(
        @InjectRepository(SmtRe, CONVERSATION_SMT_RE_CONNECTION_NAME)
        private readonly smtReRepository: Repository<SmtRe>,
    ) {}

    async getFunnelAnalytics(filter: SmtReAnalyticsFilter) {
        const baseQuery = this.smtReRepository
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
}
