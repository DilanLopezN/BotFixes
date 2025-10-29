import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CONTEXT_AI } from '../ormconfig';
import { FindManyOptions, IsNull, Repository } from 'typeorm';
import { ContextVariable } from './entities/context-variables.entity';
import { ListVariablesFromWorkspaceAndAgent } from './interfaces/list-variables-from-workspace.interface';
import { CreateContextVariable } from './interfaces/create-context-variable.interface';
import { UpdateContextVariable } from './interfaces/update-context-variable.interface';
import { DeleteContextVariable } from './interfaces/delete-training-entry.interface';
import { Exceptions } from '../../auth/exceptions';
import { CacheService } from '../../_core/cache/cache.service';
import { ContextVariableType, IContextVariableResume } from './interfaces/context-variables.interface';
import { AgentService } from '../agent/services/agent.service';

@Injectable()
export class ContextVariableService {
    constructor(
        @InjectRepository(ContextVariable, CONTEXT_AI)
        public contextVariableRepository: Repository<ContextVariable>,
        private readonly cacheService: CacheService,
        private readonly agentService: AgentService,
    ) {}

    private contextVariablesCacheKey(workspaceId: string, agentId: string): string {
        return `ctx_ai:var:${workspaceId}:a:${agentId}`;
    }

    private async removeContextVariablesCache(workspaceId: string, agentId: string): Promise<void> {
        const cacheKey = this.contextVariablesCacheKey(workspaceId, agentId);

        const client = this.cacheService.getClient();
        await client.del(cacheKey);
    }

    public async listVariablesFromAgentResume(
        data: ListVariablesFromWorkspaceAndAgent,
    ): Promise<IContextVariableResume[]> {
        const variables = await this.listVariablesFromAgent(data);
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

    public async listVariablesFromAgent(data: ListVariablesFromWorkspaceAndAgent): Promise<ContextVariable[]> {
        const client = this.cacheService.getClient();
        const cacheKey = this.contextVariablesCacheKey(data.workspaceId, data.agentId);

        try {
            const variablesFromCache = await client.get(cacheKey);

            if (variablesFromCache) {
                return JSON.parse(variablesFromCache);
            }
        } catch (error) {
            console.error('ContextVariablesService.listVariablesFromAgent', error);
        }

        const query: FindManyOptions<ContextVariable> = {
            where: {
                workspaceId: data.workspaceId,
                agentId: data.agentId,
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
            agentId: data.agentId,
        });

        if (trainingEntry) {
            throw Exceptions.DUPLICATED_CONTEXT_VARIABLE;
        }

        const agent = await this.agentService.findByWorkspaceIdAndId(data.agentId, workspaceId);

        if (!agent) {
            new BadRequestException('Agent not found', 'AGENT_NOT_FOUND');
        }

        await this.removeContextVariablesCache(workspaceId, data.agentId);
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
        });

        if (!trainingEntry) {
            throw Exceptions.NOT_FOUND;
        }

        await this.removeContextVariablesCache(workspaceId, data.agentId);
        return await this.contextVariableRepository.save({
            id: data.contextVariableId,
            workspaceId,
            updatedAt: new Date(),
            value: data.value,
        });
    }

    public async deleteContextVariable(workspaceId: string, data: DeleteContextVariable): Promise<{ ok: boolean }> {
        await this.removeContextVariablesCache(workspaceId, data.agentId);
        const result = await this.contextVariableRepository.delete({
            id: data.contextVariableId,
            workspaceId,
        });

        return { ok: result.affected > 0 };
    }

    public getVariableValue(
        variables: ContextVariable[] | IContextVariableResume[],
        variableName: string,
        defaultValue?: any,
    ): any {
        const variable = variables.find((variable) => variable.name === variableName);
        return variable ? variable.value : defaultValue;
    }
}
