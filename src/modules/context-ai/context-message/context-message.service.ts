import { Injectable } from '@nestjs/common';
import { ContextMessage } from './entities/context-message.entity';
import { CONTEXT_AI } from '../ormconfig';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IContextMessage } from './interfaces/context-message.interface';
import { DefaultResponse } from '../../../common/interfaces/default';
import { GetConsumedTokens, GetConsumedTokensResponse } from './interfaces/get-consumed-tokens';
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
}
