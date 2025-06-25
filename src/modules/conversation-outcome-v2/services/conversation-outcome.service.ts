import { Injectable } from '@nestjs/common';
import { ConversationOutcome } from '../models/conversation-outcome.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { CreateConversationOutcomeParams } from '../interfaces/create-conversation-outcome.interface';
import { DefaultResponse } from '../../../common/interfaces/default';
import { UpdateConversationOutcomeParams } from '../interfaces/update-conversation-outcome.interface';
import { Exceptions } from '../../auth/exceptions';
import { DoDeleteConversationOutcomesResponse } from '../interfaces/do-delete-conversation-outcome.interface';
import { GetConversationOutcomeParams, OutcomeStatus } from '../interfaces/get-conversation-outcome.interface';
import { CONVERSATION_CATEGORIZATION_CONNECTION } from '../../conversation-categorization-v2/ormconfig';

@Injectable()
export class ConversationOutcomeService {
    constructor(
        @InjectRepository(ConversationOutcome, CONVERSATION_CATEGORIZATION_CONNECTION)
        private conversationOutcomeRepository: Repository<ConversationOutcome>,
    ) {}

    async createConversationOutcome(
        workspaceId: string,
        data: CreateConversationOutcomeParams,
    ): Promise<DefaultResponse<ConversationOutcome>> {
        const existingOutcome = await this.conversationOutcomeRepository
            .createQueryBuilder('conversationOutcome')
            .where(
                `unaccent(LOWER(conversationOutcome.name)) = unaccent(LOWER(:name)) AND conversationOutcome.workspaceId = :workspaceId`,
                { name: data.name, workspaceId, deletedAt: null },
            )
            .getOne();

        if (existingOutcome) {
            throw Exceptions.CONVERSATION_OUTCOME_NAME_ALREADY_EXISTS;
        }

        const conversationOutcome = this.conversationOutcomeRepository.create({
            ...data,
            workspaceId,
            createdAt: moment().valueOf(),
        });

        const savedConversationOutcome = await this.conversationOutcomeRepository.save(conversationOutcome);

        return {
            data: savedConversationOutcome,
            metadata: {
                count: 1,
                skip: 0,
                limit: 1,
            },
        };
    }

    async getConversationOutcomes(
        workspaceId: string,
        data?: GetConversationOutcomeParams,
    ): Promise<DefaultResponse<ConversationOutcome[]>> {
        const queryBuilder = this.conversationOutcomeRepository
            .createQueryBuilder('conversationOutcome')
            .where({ workspaceId });

        if (data?.status === OutcomeStatus.ONLY_DELETED) {
            queryBuilder.andWhere('conversationOutcome.deletedAt IS NOT NULL');
        } else if (data?.status === OutcomeStatus.ONLY_ACTIVE) {
            queryBuilder.andWhere('conversationOutcome.deletedAt IS NULL');
        }

        if (data?.conversationOutcomeId) {
            queryBuilder.andWhere('conversationOutcome.id = :conversationOutcomeId', {
                conversationOutcomeId: data.conversationOutcomeId,
            });
        }

        if (data?.name) {
            queryBuilder.andWhere(`unaccent(LOWER(conversationOutcome.name)) LIKE unaccent(LOWER(:name))`, {
                name: `%${data.name}%`,
            });
        }

        const conversationOutcomes = await queryBuilder
            .orderBy('conversationOutcome.deletedAt', 'ASC', 'NULLS FIRST')
            .getMany();

        return {
            data: conversationOutcomes,
            metadata: {
                count: conversationOutcomes.length,
                skip: 0,
                limit: conversationOutcomes.length,
            },
        };
    }

    async updateConversationOutcome(
        workspaceId: string,
        data: UpdateConversationOutcomeParams,
    ): Promise<DefaultResponse<ConversationOutcome>> {
        const qb = this.conversationOutcomeRepository
            .createQueryBuilder('out')
            .where(`unaccent(LOWER(conversationOutcome.name)) = unaccent(LOWER(:name))`, { name: data.name })
            .andWhere(`out.workspaceId = :workspaceId`, { workspaceId })
            .andWhere(`out.id <> :id`, { id: data.id })
            .andWhere(`out.deletedAt IS NULL`);

        const existingOutcome = await qb.getOne();

        if (existingOutcome) {
            throw Exceptions.CONVERSATION_OUTCOME_NAME_ALREADY_EXISTS;
        }

        const conversationOutcome = await this.conversationOutcomeRepository.findOne({
            where: { id: data.id, workspaceId, deletedAt: null },
        });

        if (!conversationOutcome) {
            throw Exceptions.CONVERSATION_OUTCOME_NOT_FOUND;
        }

        conversationOutcome.name = data.name || conversationOutcome.name;
        conversationOutcome.tags = data.tags || conversationOutcome.tags;
        conversationOutcome.updatedAt = moment().valueOf();

        const updatedConversationOutcome = await this.conversationOutcomeRepository.save(conversationOutcome);

        return {
            data: updatedConversationOutcome,
        };
    }

    async deleteConversationOutcomes(
        workspaceId: string,
        conversationOutcomeIds: number[],
    ): Promise<DoDeleteConversationOutcomesResponse> {
        const conversationOutcomes = await this.conversationOutcomeRepository.find({
            where: { id: In(conversationOutcomeIds), workspaceId, deletedAt: null },
        });

        if (conversationOutcomes.length === 0) {
            throw Exceptions.CONVERSATION_OUTCOME_NOT_FOUND;
        }

        conversationOutcomes.forEach((conversationOutcome) => {
            conversationOutcome.deletedAt = moment().valueOf();
        });

        await this.conversationOutcomeRepository.save(conversationOutcomes);

        return { ok: conversationOutcomes.length > 0 };
    }

    async getConversationOutcomeById(conversationOutcomeId: number) {
        return this.conversationOutcomeRepository.findOne({ where: { id: conversationOutcomeId } });
    }

    async restoreConversationOutcome(workspaceId: string, conversationOutcomeId: number): Promise<{ ok: boolean }> {
        const conversationOutcome = await this.conversationOutcomeRepository
            .createQueryBuilder('conversationOutcome')
            .where('conversationOutcome.id = :id', { id: conversationOutcomeId })
            .andWhere('conversationOutcome.workspaceId = :workspaceId', { workspaceId })
            .andWhere('conversationOutcome.deletedAt IS NOT NULL')
            .getOne();

        if (!conversationOutcome) {
            throw Exceptions.CONVERSATION_OUTCOME_NOT_FOUND;
        }

        conversationOutcome.deletedAt = null;

        await this.conversationOutcomeRepository.save(conversationOutcome);

        return { ok: true };
    }
}
