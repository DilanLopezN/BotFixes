import { Injectable } from '@nestjs/common';
import { ContextMessage } from './entities/context-message.entity';
import { CONTEXT_AI } from '../ormconfig';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IContextMessage, ContextMessageRole, ContextMessageType } from './interfaces/context-message.interface';
import { DefaultResponse } from '../../../common/interfaces/default';
import { GetConsumedTokens, GetConsumedTokensResponse } from './interfaces/get-consumed-tokens';
import { ListContextMessages, ContextMessagePair } from './interfaces/list-context-messages.interface';
import * as moment from 'moment';
import { COMPLETION_MODEL_COST, PROMPT_MODEL_COST } from '../defaults';

@Injectable()
export class ContextMessageService {
    constructor(
        @InjectRepository(ContextMessage, CONTEXT_AI)
        public contextMessageRepository: Repository<ContextMessage>,
    ) {}

    public async create(message: Omit<IContextMessage, 'id' | 'createdAt'>) {
        return await this.contextMessageRepository.save({
            ...message,
            createdAt: new Date(),
        });
    }

    public bulkCreate(messages: Omit<IContextMessage, 'id' | 'createdAt'>[]): Promise<IContextMessage[]> {
        const contextMessages = messages.map((message) => ({
            ...message,
            createdAt: new Date(),
        }));
        return this.contextMessageRepository.save(contextMessages);
    }

    public async listMessagesByContextId(contextId: string): Promise<ContextMessage[]> {
        return await this.contextMessageRepository.find({
            where: {
                contextId,
            },
        });
    }

    public async getConsumedTokens(
        workspaceId: string,
        { startDate, endDate }: GetConsumedTokens,
    ): Promise<DefaultResponse<GetConsumedTokensResponse[]>> {
        const result = await this.contextMessageRepository
            .createQueryBuilder()
            .where('workspace_id = :workspaceId', { workspaceId })
            .where('created_at::timestamp BETWEEN :startDate::timestamp AND :endDate::timestamp', {
                startDate: moment(startDate).startOf('day').toISOString(),
                endDate: moment(endDate).endOf('day').toISOString(),
            })
            .select("DATE_TRUNC('day', created_at)", 'date')
            .addSelect('SUM(prompt_tokens)', 'promptTokens')
            .addSelect('SUM(completion_tokens)', 'completionTokens')
            .groupBy("DATE_TRUNC('day', created_at)")
            .orderBy("DATE_TRUNC('day', created_at)")
            .getRawMany();

        return {
            data: result.map(({ promptTokens, completionTokens, ...data }) => ({
                ...data,
                promptTokens,
                completionTokens,
                promptTokensCost: (promptTokens / 1_000_000) * PROMPT_MODEL_COST,
                completionTokensCost: (completionTokens / 1_000_000) * COMPLETION_MODEL_COST,
            })),
        };
    }

    public async listContextMessagesByWorkspaceId(
        workspaceId: string,
        { startDate, endDate, search, agentId, skip = 0, limit = 10 }: ListContextMessages,
    ): Promise<{ data: ContextMessagePair[]; count: number }> {
        const startOfDay = moment(startDate).startOf('day').toDate();
        const endOfDay = moment(endDate).endOf('day').toDate();

        let baseQuery = this.contextMessageRepository
            .createQueryBuilder('userMsg')
            .leftJoin(
                'context_message',
                'systemMsg',
                'userMsg.referenceId = systemMsg.referenceId AND systemMsg.role = :systemRole AND systemMsg.workspaceId = :workspaceId',
                { systemRole: ContextMessageRole.system, workspaceId },
            )
            .select('userMsg.referenceId', 'referenceId')
            .addSelect('userMsg.id', 'userMessageId')
            .addSelect('userMsg.content', 'userContent')
            .addSelect('userMsg.createdAt', 'userCreatedAt')
            .addSelect('userMsg.contextId', 'userContextId')
            .addSelect('systemMsg.id', 'systemMessageId')
            .addSelect('systemMsg.content', 'systemContent')
            .addSelect('systemMsg.createdAt', 'systemCreatedAt')
            .addSelect('systemMsg.contextId', 'systemContextId')
            .where('userMsg.workspaceId = :workspaceId', { workspaceId })
            .andWhere('userMsg.role = :userRole', { userRole: ContextMessageRole.user })
            .andWhere('userMsg.isFallback = :isFallback', { isFallback: false })
            .andWhere('userMsg.createdAt BETWEEN :startDate AND :endDate', {
                startDate: startOfDay,
                endDate: endOfDay,
            })
            .andWhere('userMsg.type != :rewriteType AND systemMsg.type != :rewriteType', {
                rewriteType: ContextMessageType.rewrite,
            });

        if (search) {
            baseQuery = baseQuery.andWhere('(userMsg.content ILIKE :search OR systemMsg.content ILIKE :search)', {
                search: `%${search}%`,
            });
        }

        if (agentId) {
            baseQuery = baseQuery.andWhere('userMsg.agentId = :agentId', { agentId });
        }

        const countQuery = baseQuery.clone().select('COUNT(*)', 'total');
        const dataQuery = baseQuery
            .orderBy('userMsg.createdAt', 'DESC')
            .offset(skip)
            .limit(limit > 0 ? limit : 1000);

        const [countResult, dataResult] = await Promise.all([countQuery.getRawOne(), dataQuery.getRawMany()]);

        const count = parseInt(countResult.total);
        const pairs: ContextMessagePair[] = dataResult.map((row: any) => ({
            referenceId: row.referenceId,
            userMessage: {
                id: row.userMessageId,
                content: row.userContent,
                createdAt: row.userCreatedAt,
                contextId: row.userContextId,
            },
            systemMessage: row.systemMessageId
                ? {
                      id: row.systemMessageId,
                      content: row.systemContent,
                      createdAt: row.systemCreatedAt,
                      contextId: row.systemContextId,
                  }
                : null,
        }));

        return { data: pairs, count };
    }
}
