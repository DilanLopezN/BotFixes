import { Injectable } from '@nestjs/common';
import { ConversationObjective } from '../models/conversation-objective.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { CreateConversationObjectiveParams } from '../interfaces/create-conversation-objective.interface';
import { DefaultResponse } from '../../../common/interfaces/default';
import { UpdateConversationObjectiveParams } from '../interfaces/update-conversation-objective.interface';
import { Exceptions } from '../../auth/exceptions';
import { DoDeleteConversationObjectivesResponse } from '../interfaces/do-delete-conversation-objective.interface';
import { GetConversationObjectiveParams, ObjectiveStatus } from '../interfaces/get-conversation-objective.interface';
import { CONVERSATION_CATEGORIZATION_CONNECTION } from '../../conversation-categorization-v2/ormconfig';

@Injectable()
export class ConversationObjectiveService {
    constructor(
        @InjectRepository(ConversationObjective, CONVERSATION_CATEGORIZATION_CONNECTION)
        private conversationObjectiveRepository: Repository<ConversationObjective>,
    ) {}

    async createConversationObjective(
        workspaceId: string,
        data: CreateConversationObjectiveParams,
    ): Promise<DefaultResponse<ConversationObjective>> {
        const existingObjective = await this.conversationObjectiveRepository
            .createQueryBuilder('conversationObjective')
            .where(
                `unaccent(LOWER(conversationObjective.name)) = unaccent(LOWER(:name)) AND conversationObjective.workspaceId = :workspaceId`,
                { name: data.name, workspaceId, deletedAt: null },
            )
            .getOne();

        if (existingObjective) {
            throw Exceptions.CONVERSATION_OBJECTIVE_NAME_ALREADY_EXISTS;
        }
        const conversationObjective = this.conversationObjectiveRepository.create({
            ...data,
            workspaceId,
            createdAt: moment().valueOf(),
        });

        const savedConversationObjective = await this.conversationObjectiveRepository.save(conversationObjective);

        return {
            data: savedConversationObjective,
            metadata: {
                count: 1,
                skip: 0,
                limit: 1,
            },
        };
    }

    async getConversationObjectives(
        workspaceId: string,
        data?: GetConversationObjectiveParams,
    ): Promise<DefaultResponse<ConversationObjective[]>> {
        const queryBuilder = this.conversationObjectiveRepository
            .createQueryBuilder('conversationObjective')
            .where({ workspaceId });

        if (data?.status === ObjectiveStatus.ONLY_DELETED) {
            queryBuilder.andWhere('conversationObjective.deletedAt IS NOT NULL');
        } else if (data?.status === ObjectiveStatus.ONLY_ACTIVE) {
            queryBuilder.andWhere('conversationObjective.deletedAt IS NULL');
        }

        if (data?.conversationObjectiveId) {
            queryBuilder.andWhere('conversationObjective.id = :conversationObjectiveId', {
                conversationObjectiveId: data.conversationObjectiveId,
            });
        }

        if (data?.name) {
            queryBuilder.andWhere(`unaccent(LOWER(conversationObjective.name)) LIKE unaccent(LOWER(:name))`, {
                name: `%${data.name}%`,
            });
        }

        const conversationObjectives = await queryBuilder
            .orderBy('conversationObjective.deletedAt', 'ASC', 'NULLS FIRST')
            .getMany();

        return {
            data: conversationObjectives,
            metadata: {
                count: conversationObjectives.length,
                skip: 0,
                limit: conversationObjectives.length,
            },
        };
    }

    async updateConversationObjective(
        workspaceId: string,
        data: UpdateConversationObjectiveParams,
    ): Promise<DefaultResponse<ConversationObjective>> {
        const qb = this.conversationObjectiveRepository
            .createQueryBuilder('obj')
            .where(`unaccent(LOWER(obj.name)) = unaccent(LOWER(:name))`, { name: data.name })
            .andWhere(`obj.workspaceId = :workspaceId`, { workspaceId })
            .andWhere(`obj.id <> :id`, { id: data.id })
            .andWhere(`obj.deletedAt IS NULL`);

        const existingObjective = await qb.getOne();

        if (existingObjective) {
            throw Exceptions.CONVERSATION_OBJECTIVE_NAME_ALREADY_EXISTS;
        }

        const conversationObjective = await this.conversationObjectiveRepository.findOne({
            where: { id: data.id, workspaceId, deletedAt: null },
        });

        if (!conversationObjective) {
            throw Exceptions.CONVERSATION_OBJECTIVE_NOT_FOUND;
        }

        conversationObjective.name = data.name || conversationObjective.name;
        conversationObjective.updatedAt = moment().valueOf();

        const updatedConversationObjective = await this.conversationObjectiveRepository.save(conversationObjective);

        return {
            data: updatedConversationObjective,
        };
    }

    async deleteConversationObjectives(
        workspaceId: string,
        conversationObjectiveIds: number[],
    ): Promise<DoDeleteConversationObjectivesResponse> {
        const conversationObjectives = await this.conversationObjectiveRepository.find({
            where: { id: In(conversationObjectiveIds), workspaceId, deletedAt: null },
        });

        if (conversationObjectives.length === 0) {
            throw Exceptions.CONVERSATION_OBJECTIVE_NOT_FOUND;
        }

        conversationObjectives.forEach((conversationObjective) => {
            conversationObjective.deletedAt = moment().valueOf();
        });

        await this.conversationObjectiveRepository.save(conversationObjectives);

        return { ok: conversationObjectives.length > 0 };
    }

    async getConversationObjectiveById(conversationObjectiveId: number) {
        return this.conversationObjectiveRepository.findOne({ where: { id: conversationObjectiveId } });
    }

    async restoreConversationObjective(workspaceId: string, conversationObjectiveId: number): Promise<{ ok: boolean }> {
        const conversationObjective = await this.conversationObjectiveRepository
            .createQueryBuilder('conversationObjective')
            .where('conversationObjective.id = :id', { id: conversationObjectiveId })
            .andWhere('conversationObjective.workspaceId = :workspaceId', { workspaceId })
            .andWhere('conversationObjective.deletedAt IS NOT NULL')
            .getOne();

        if (!conversationObjective) {
            throw Exceptions.CONVERSATION_OBJECTIVE_NOT_FOUND;
        }

        conversationObjective.deletedAt = null;

        await this.conversationObjectiveRepository.save(conversationObjective);

        return { ok: true };
    }
}
