import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntentActions } from '../entities/intent-actions.entity';
import {
    CreateIntentActionsData,
    UpdateIntentActionsData,
    DeleteIntentActionsData,
    ListIntentActionsFilter,
    IIntentActions,
} from '../interfaces/intent-actions.interface';
import { CONTEXT_AI } from '../../ormconfig';

@Injectable()
export class IntentActionsService {
    constructor(
        @InjectRepository(IntentActions, CONTEXT_AI)
        private readonly intentActionsRepository: Repository<IntentActions>,
    ) {}

    public async create(data: CreateIntentActionsData): Promise<IIntentActions> {
        const intentAction = this.intentActionsRepository.create(data);
        return this.intentActionsRepository.save(intentAction);
    }

    public async update(data: UpdateIntentActionsData): Promise<IIntentActions> {
        const intentAction = await this.intentActionsRepository.findOne({
            where: { id: data.intentActionsId },
        });

        if (!intentAction) {
            throw new NotFoundException(`IntentAction with ID ${data.intentActionsId} not found`);
        }

        Object.assign(intentAction, data);

        return this.intentActionsRepository.save(intentAction);
    }

    public async delete(data: DeleteIntentActionsData): Promise<{ ok: boolean }> {
        const result = await this.intentActionsRepository.delete(data.intentActionsId);

        if (!result.affected) {
            throw new NotFoundException(`IntentAction with ID ${data.intentActionsId} not found`);
        }

        return { ok: !!result.affected };
    }

    public async findById(intentActionsId: string): Promise<IIntentActions | null> {
        return this.intentActionsRepository.findOne({ where: { id: intentActionsId } });
    }

    public async findByIntentId(intentId: string): Promise<IIntentActions[]> {
        return this.intentActionsRepository.find({
            where: { intentId },
            order: { createdAt: 'ASC' },
        });
    }

    public async list(filter: ListIntentActionsFilter): Promise<IIntentActions[]> {
        const whereClause: any = {};

        if (filter.intentId) {
            whereClause.intentId = filter.intentId;
        }

        return this.intentActionsRepository.find({
            where: whereClause,
            order: {
                createdAt: 'ASC',
            },
        });
    }
}
