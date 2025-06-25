import { Injectable } from '@nestjs/common';
import { ContextFallbackMessage } from './entities/context-fallback-message.entity';
import { CONTEXT_AI } from '../ormconfig';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IContextFallbackMessage } from './interfaces/context-fallback-message.interface';
import { ListFallbackMessages } from './interfaces/list-fallback-messages.interface';

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

    public async listgFallbackMessagesByWorkspaceId(
        workspaceId: string,
        { startDate, endDate }: ListFallbackMessages,
    ): Promise<IContextFallbackMessage[]> {
        return await this.contextFallbackMessageRepository.find({
            where: {
                workspaceId,
                createdAt: Between(startDate, endDate),
            },
        });
    }
}
