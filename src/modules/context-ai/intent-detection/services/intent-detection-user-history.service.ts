import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { IntentDetectionUserHistory } from '../entities/intent-detection-user-history.entity';
import {
    CreateIntentDetectionUserHistoryData,
    IIntentDetectionUserHistory,
    ListIntentDetectionUserHistoryFilter,
} from '../interfaces/intent-detection-user-history.interface';
import { CONTEXT_AI } from '../../ormconfig';

@Injectable()
export class IntentDetectionUserHistoryService {
    constructor(
        @InjectRepository(IntentDetectionUserHistory, CONTEXT_AI)
        private readonly intentDetectionUserHistoryRepository: Repository<IntentDetectionUserHistory>,
    ) {}

    public async create(data: CreateIntentDetectionUserHistoryData): Promise<IIntentDetectionUserHistory> {
        const log = this.intentDetectionUserHistoryRepository.create(data);
        return this.intentDetectionUserHistoryRepository.save(log);
    }

    public async list(filter: ListIntentDetectionUserHistoryFilter): Promise<IIntentDetectionUserHistory[]> {
        const whereClause: any = {};

        if (filter.workspaceId) {
            whereClause.workspaceId = filter.workspaceId;
        }

        if (filter.agentId) {
            whereClause.agentId = filter.agentId;
        }

        if (filter.detected !== undefined) {
            whereClause.detected = filter.detected;
        }

        if (filter.startDate && filter.endDate) {
            whereClause.createdAt = Between(filter.startDate, filter.endDate);
        } else if (filter.startDate) {
            whereClause.createdAt = Between(filter.startDate, new Date());
        }

        return this.intentDetectionUserHistoryRepository.find({
            where: whereClause,
            order: {
                createdAt: 'DESC',
            },
            relations: ['detectedIntent'],
        });
    }
}
