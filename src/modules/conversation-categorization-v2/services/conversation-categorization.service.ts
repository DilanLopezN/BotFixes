import { Injectable } from '@nestjs/common';
import { ConversationCategorization } from '../models/conversation-categorization.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CONVERSATION_CATEGORIZATION_CONNECTION } from '../ormconfig';
import * as moment from 'moment';
import { CreateConversationCategorizationParams } from '../interfaces/create-conversation-categorization.interface';
import { DefaultRequest, DefaultResponse } from '../../../common/interfaces/default';
import { UpdateConversationCategorizationParams } from '../interfaces/update-conversation-categorization.interface';
import { Exceptions } from '../../auth/exceptions';
import { DoDeleteConversationCategorizationResponse } from '../interfaces/do-delete-conversation-categorization.interface';
import { ExternalDataService } from './external-data.service';
import {
    GetConversationCategorizationParams,
    GetConversationCategorizationResponse,
} from '../interfaces/get-conversation-categorization.interface';
import { ConversationObjective } from '../../conversation-objective-v2/models/conversation-objective.entity';
import { ConversationOutcome } from '../../conversation-outcome-v2/models/conversation-outcome.entity';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class ConversationCategorizationService {
    constructor(
        @InjectRepository(ConversationCategorization, CONVERSATION_CATEGORIZATION_CONNECTION)
        private conversationCategorizationRepository: Repository<ConversationCategorization>,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async createConversationCategorization(
        workspaceId: string,
        data: CreateConversationCategorizationParams,
    ): Promise<DefaultResponse<ConversationCategorization>> {
        const hasConversationCategorization = await this.conversationCategorizationRepository.findOne({
            workspaceId,
            conversationId: data.conversationId,
        });
        if (hasConversationCategorization) {
            throw Exceptions.CONVERSATION_CATEGORIZATION_ALREADY_EXISTS;
        }
        const workspace = await this.externalDataService.getWorkspace(workspaceId);
        if (!workspace) {
            throw Exceptions.WORKSPACE_NOT_FOUND;
        }
        if (!workspace.userFeatureFlag?.enableConversationCategorization) {
            throw Exceptions.WORKSPACE_CONVERSATION_CATEGORIZATION_DISABLED;
        }
        const conversation = await this.externalDataService.getConversation(data.conversationId);
        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }
        const team = await this.externalDataService.getTeam(workspaceId, conversation.assignedToTeamId);
        if (!team) {
            throw Exceptions.TEAM_NOT_FOUND;
        }
        if (team.requiredConversationCategorization && (!data.objectiveId || !data.outcomeId)) {
            throw Exceptions.TEAM_REQUIRES_CONVERSATION_CATEGORIZATION;
        }
        if ((data.description || data.objectiveId || data.outcomeId) && (!data.objectiveId || !data.outcomeId)) {
            throw Exceptions.CONVERSATION_CATEGORIZATION_REQUIRED;
        }
        if (!data.objectiveId && !data.outcomeId && !data.conversationTags && !data.description) {
            return {
                data: {} as ConversationCategorization,
                metadata: {
                    count: 0,
                    skip: 0,
                    limit: 1,
                },
            };
        }
        const conversationCategorization = this.conversationCategorizationRepository.create({
            ...data,
            workspaceId,
            iid: conversation.iid,
            teamId: conversation.assignedToTeamId,
            createdAt: moment().valueOf(),
        });

        const savedConversationCategorization = await this.conversationCategorizationRepository.save(
            conversationCategorization,
        );

        return {
            data: savedConversationCategorization,
            metadata: {
                count: 1,
                skip: 0,
                limit: 1,
            },
        };
    }

    async getConversationCategorizations(
        workspaceId: string,
        query: DefaultRequest<GetConversationCategorizationParams>,
    ): Promise<DefaultResponse<GetConversationCategorizationResponse[]>> {
        const skip = query?.skip ?? 0;
        const limit = query?.limit ?? 10;
        const data = query.data;

        const q = this.conversationCategorizationRepository
            .createQueryBuilder('conversationCategorization')
            .where('conversationCategorization.workspaceId = :workspaceId', { workspaceId })
            .andWhere('conversationCategorization.deletedAt IS NULL')
            .innerJoinAndMapOne(
                'conversationCategorization.objective',
                ConversationObjective,
                'objective',
                `objective.id = conversationCategorization.objective_id`,
            )
            .innerJoinAndMapOne(
                'conversationCategorization.outcome',
                ConversationOutcome,
                'outcome',
                `outcome.id = conversationCategorization.outcome_id`,
            )
            .skip(skip);

        if (limit > 0) {
            q.take(limit);
        }

        if (data.conversationCategorizationId) {
            q.andWhere('conversationCategorization.id = :conversationCategorizationId', {
                conversationCategorizationId: data.conversationCategorizationId,
            });
        }

        if (data.objectiveIds?.length > 0) {
            q.andWhere('conversationCategorization.objectiveId IN (:...objectiveIds)', {
                objectiveIds: data.objectiveIds,
            });
        }

        if (data.outcomeIds?.length > 0) {
            q.andWhere('conversationCategorization.outcomeId IN (:...outcomeIds)', { outcomeIds: data.outcomeIds });
        }

        if (data.userIds?.length > 0) {
            q.andWhere('conversationCategorization.userId IN (:...userIds)', { userIds: data.userIds });
        }

        if (data.conversationTags?.length > 0) {
            q.andWhere('conversationCategorization.conversationTags && ARRAY[:...conversationTags]', {
                conversationTags: data.conversationTags,
            });
        }

        if (data.description) {
            q.andWhere(`unaccent(LOWER(conversationCategorization.description)) LIKE unaccent(LOWER(:description))`, {
                description: `%${data.description}%`,
            });
        }

        if (data.startDate) {
            q.andWhere('(conversationCategorization.created_at >= :startDate)', {
                startDate: data.startDate,
            });
        }

        if (data.endDate) {
            q.andWhere('(conversationCategorization.created_at <= :endDate)', {
                endDate: data.endDate,
            });
        }

        if (data.teamIds?.length > 0) {
            q.andWhere('conversationCategorization.teamId IN (:...teamIds)', {
                teamIds: data.teamIds,
            });
        }

        const [conversationCategorizations, count] = await q.getManyAndCount();

        const conversationCategorizationsResponse: GetConversationCategorizationResponse[] = [
            ...conversationCategorizations,
        ];

        const usersSet = new Set<string>();
        conversationCategorizations.forEach((item) => usersSet.add(item.userId));

        const users = await this.externalDataService.getUsersByIds(Array.from(usersSet));
        const usersMap = users.reduce((acc, user) => {
            const userId = castObjectIdToString(user._id);

            if (!acc[userId]) {
                acc[userId] = { id: userId, name: user.name };
            }

            return acc;
        }, {});

        for (const conversationCategorizationItem of conversationCategorizationsResponse) {
            conversationCategorizationItem.user = usersMap[conversationCategorizationItem.userId];
        }

        return {
            data: conversationCategorizationsResponse,
            metadata: {
                count,
                skip,
                limit,
            },
        };
    }

    async updateConversationCategorization(
        workspaceId: string,
        data: UpdateConversationCategorizationParams,
    ): Promise<DefaultResponse<ConversationCategorization>> {
        let conversationCategorization = await this.conversationCategorizationRepository.findOne({
            workspaceId,
            conversationId: data.conversationId,
        });

        if (!conversationCategorization) {
            const createResult = await this.createConversationCategorization(workspaceId, data);

            if (createResult?.data?.id) {
                return createResult;
            }
            throw Exceptions.CONVERSATION_CATEGORIZATION_NOT_FOUND;
        }

        const workspace = await this.externalDataService.getWorkspace(workspaceId);
        if (!workspace) {
            throw Exceptions.WORKSPACE_NOT_FOUND;
        }
        if (!workspace.userFeatureFlag?.enableConversationCategorization) {
            throw Exceptions.WORKSPACE_CONVERSATION_CATEGORIZATION_DISABLED;
        }
        const conversation = await this.externalDataService.getConversation(data.conversationId);
        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }
        const team = await this.externalDataService.getTeam(workspaceId, conversation.assignedToTeamId);
        if (!team) {
            throw Exceptions.TEAM_NOT_FOUND;
        }
        if (team.requiredConversationCategorization && (!data.objectiveId || !data.outcomeId)) {
            throw Exceptions.TEAM_REQUIRES_CONVERSATION_CATEGORIZATION;
        }
        if ((data.description || data.objectiveId || data.outcomeId) && (!data.objectiveId || !data.outcomeId)) {
            throw Exceptions.CONVERSATION_CATEGORIZATION_REQUIRED;
        }

        conversationCategorization = {
            ...conversationCategorization,
            ...data,
            updatedAt: moment().valueOf(),
        };

        const updatedConversationCategorization = await this.conversationCategorizationRepository.save(
            conversationCategorization,
        );

        return {
            data: updatedConversationCategorization,
        };
    }

    async deleteConversationCategorization(
        workspaceId: string,
        conversationCategorizationId: number,
    ): Promise<DoDeleteConversationCategorizationResponse> {
        const conversationCategorization = await this.conversationCategorizationRepository.findOne({
            where: { id: conversationCategorizationId, workspaceId, deletedAt: null },
        });

        if (!conversationCategorization) {
            throw Exceptions.CONVERSATION_CATEGORIZATION_NOT_FOUND;
        }

        conversationCategorization.deletedAt = moment().valueOf();

        await this.conversationCategorizationRepository.save(conversationCategorization);

        return { ok: conversationCategorization.id ? true : false };
    }

    async getConversationCategorizationsCsv(
        workspaceId: string,
        filter: DefaultRequest<GetConversationCategorizationParams>,
    ): Promise<any[]> {
        const { data } = await this.getConversationCategorizations(workspaceId, { ...filter, limit: 0 });

        const dataFormated: any = data?.map((convCategorization) => {
            return {
                ID: convCategorization.id,
                Agente: convCategorization.user?.name,
                Objetivo: convCategorization.objective?.name,
                Desfecho: convCategorization.outcome?.name,
                Etiquetas: convCategorization.conversationTags?.join(', '),
                Descrição: convCategorization.description,
                Data: new Date(convCategorization.createdAt).toLocaleString('pt-BR'),
            };
        });

        return dataFormated;
    }
}
