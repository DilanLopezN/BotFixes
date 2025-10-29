import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from '../ormconfig';

import { ConversationAutomaticDistributionLog } from '../models/conversation-automatic-distribution-log.entity';

@Injectable()
export class ConversationAutomaticDistributionLogService {
    constructor(
        @InjectRepository(ConversationAutomaticDistributionLog, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION)
        private conversationAutomaticDistributionLogRepository: Repository<ConversationAutomaticDistributionLog>,
    ) {}

    async save(data: ConversationAutomaticDistributionLog) {
        return await this.conversationAutomaticDistributionLogRepository.save(data);
    }

    async getLastAssignmentByTeamId(teamId: string) {
        return await this.conversationAutomaticDistributionLogRepository
            .createQueryBuilder('log')
            .where('log.teamId = :teamId', { teamId })
            .orderBy('log.createdAt', 'DESC')
            .limit(1)
            .getOne();
    }

    async getAssignmentsByAgentIdList(agentIds: string[]) {
        if (!agentIds || agentIds.length === 0) {
            return [];
        }

        return await this.conversationAutomaticDistributionLogRepository
            .createQueryBuilder('log')
            .select(['log.assignedAgentId', 'MAX(log.createdAt) as lastAssignedAt'])
            .where('log.assignedAgentId IN (:...agentIds)', { agentIds })
            .groupBy('log.assignedAgentId')
            .getRawMany();
    }
}
