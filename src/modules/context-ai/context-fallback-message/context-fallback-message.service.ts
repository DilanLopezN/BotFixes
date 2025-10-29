import { Injectable } from '@nestjs/common';
import { ContextFallbackMessage } from './entities/context-fallback-message.entity';
import { CONTEXT_AI } from '../ormconfig';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IContextFallbackMessage } from './interfaces/context-fallback-message.interface';
import { ListFallbackMessages } from './interfaces/list-fallback-messages.interface';
import * as moment from 'moment';

@Injectable()
export class ContextFallbackMessageService {
    constructor(
        @InjectRepository(ContextFallbackMessage, CONTEXT_AI)
        public contextFallbackMessageRepository: Repository<ContextFallbackMessage>,
    ) {}

    public async create(message: Omit<IContextFallbackMessage, 'id' | 'createdAt'>) {
        return await this.contextFallbackMessageRepository.save({
            ...message,
            createdAt: new Date(),
        });
    }

    public async listFallbackMessagesByWorkspaceId(
        workspaceId: string,
        { startDate, endDate, search, agentId, skip = 0, limit = 10 }: ListFallbackMessages,
    ): Promise<{ data: IContextFallbackMessage[]; count: number }> {
        const startOfDay = moment(startDate).startOf('day').toDate();
        const endOfDay = moment(endDate).endOf('day').toDate();

        const q = this.contextFallbackMessageRepository
            .createQueryBuilder('contextFallbackMessage')
            .where('contextFallbackMessage.workspaceId = :workspaceId', { workspaceId })
            .andWhere('contextFallbackMessage.createdAt BETWEEN :startDate AND :endDate', {
                startDate: startOfDay,
                endDate: endOfDay,
            })
            .skip(skip);

        if (search) {
            q.andWhere('(contextFallbackMessage.question ILIKE :search)', { search: `%${search}%` });
        }

        if (agentId) {
            q.andWhere('contextFallbackMessage.agentId = :agentId', { agentId });
        }

        if (limit > 0) {
            q.take(limit);
        }

        q.orderBy('contextFallbackMessage.createdAt', 'DESC');

        const [data, count] = await q.getManyAndCount();

        return { data, count };
    }
}
