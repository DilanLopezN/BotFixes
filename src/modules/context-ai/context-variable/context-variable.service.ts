import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CONTEXT_AI } from '../ormconfig';
import { FindManyOptions, IsNull, Repository } from 'typeorm';
import { ContextVariable } from './entities/context-variables.entity';
import { ListVariablesFromWorkspace } from './interfaces/list-variables-from-workspace.interface';
import { CreateContextVariable } from './interfaces/create-context-variable.interface';
import { UpdateContextVariable } from './interfaces/update-context-variable.interface';
import { DeleteContextVariable } from './interfaces/delete-training-entry.interface';
import { Exceptions } from '../../auth/exceptions';
import { CacheService } from '../../_core/cache/cache.service';
import { ContextVariableType, IContextVariableResume } from './interfaces/context-variables.interface';

@Injectable()
export class ContextVariableService {
    constructor(
        @InjectRepository(ContextVariable, CONTEXT_AI)
        public contextVariableRepository: Repository<ContextVariable>,
        private readonly cacheService: CacheService,
    ) {}

    private contextVariablesCacheKey(workspaceId: string, botId?: string): string {
        return `ctx_ai:variables:${workspaceId}`;
    }

    private async removeContextVariablesCache(workspaceId: string, botId?: string): Promise<void> {
        const cacheKey = this.contextVariablesCacheKey(workspaceId);

        const client = this.cacheService.getClient();
        await client.del(cacheKey);
    }

    public async listVariablesFromWorkspaceResume(data: ListVariablesFromWorkspace): Promise<IContextVariableResume[]> {
        const variables = await this.listVariablesFromWorkspace(data);
        return variables
            .filter(({ type }) =>
                [
                    ContextVariableType.action_button,
                    ContextVariableType.action_fallback,
                    ContextVariableType.action_redirect,
                ].includes(type),
            )
            .map(({ id, name, value }) => ({
                id,
                name,
                value,
            }));
    }

    public async listVariablesFromWorkspace(data: ListVariablesFromWorkspace): Promise<ContextVariable[]> {
        const client = this.cacheService.getClient();
        const cacheKey = this.contextVariablesCacheKey(data.workspaceId);

        try {
            const variablesFromCache = await client.get(cacheKey);

            if (variablesFromCache) {
                return JSON.parse(variablesFromCache);
            }
        } catch (error) {
            console.error('ContextVariablesService.listVariablesFromWorkspace', error);
        }

        const query: FindManyOptions<ContextVariable> = {
            where: {
                workspaceId: data.workspaceId,
                ...(data.botId ? { botId: data.botId } : {}),
                deletedAt: IsNull(),
            },
        };

        const result = await this.contextVariableRepository.find(query);
        await client.set(cacheKey, JSON.stringify(result));
        return result;
    }

    public async createContextVariable(workspaceId: string, data: CreateContextVariable): Promise<ContextVariable> {
        const trainingEntry = await this.contextVariableRepository.findOne({
            name: data.name,
            workspaceId,
            deletedAt: IsNull(),
        });

        if (trainingEntry) {
            throw Exceptions.DUPLICATED_CONTEXT_VARIABLE;
        }

        await this.removeContextVariablesCache(workspaceId);
        return await this.contextVariableRepository.save({
            workspaceId,
            contextId: null,
            createdAt: new Date(),
            ...data,
        });
    }

    public async updateContextVariable(workspaceId: string, data: UpdateContextVariable): Promise<ContextVariable> {
        const trainingEntry = await this.contextVariableRepository.findOne({
            id: data.contextVariableId,
            workspaceId,
            deletedAt: IsNull(),
        });

        if (!trainingEntry) {
            throw Exceptions.NOT_FOUND;
        }

        await this.removeContextVariablesCache(workspaceId);
        return await this.contextVariableRepository.save({
            id: data.contextVariableId,
            workspaceId,
            updatedAt: new Date(),
            value: data.value,
        });
    }

    public async deleteContextVariable(workspaceId: string, data: DeleteContextVariable): Promise<ContextVariable> {
        await this.removeContextVariablesCache(workspaceId);
        return await this.contextVariableRepository.save({
            id: data.contextVariableId,
            workspaceId,
            deletedAt: new Date(),
        });
    }
}
