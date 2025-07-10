import { BadRequestException, Injectable } from '@nestjs/common';
import { CONTEXT_AI } from '../ormconfig';
import { FindManyOptions, Repository } from 'typeorm';
import { TrainingEntry } from './entities/training-entry.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTrainingEntry } from './interfaces/create-training-entry.interface';
import { DefaultResponse } from '../../../common/interfaces/default';
import { DeleteTrainingEntry } from './interfaces/delete-training-entry.interface';
import { UpdateTrainingEntry } from './interfaces/update-training-entry.interface';
import { Exceptions } from '../../auth/exceptions';
import { GetTrainingEntry } from './interfaces/get-training-entry.interface';
import { AgentService } from '../agent/services/agent.service';

@Injectable()
export class TrainingEntryService {
    constructor(
        @InjectRepository(TrainingEntry, CONTEXT_AI)
        public trainingEntryRepository: Repository<TrainingEntry>,
        protected agentService: AgentService,
    ) {}

    public async createTrainingEntry(
        workspaceId: string,
        data: CreateTrainingEntry,
    ): Promise<DefaultResponse<TrainingEntry>> {
        const agent = await this.agentService.findByWorkspaceIdAndId(data.agentId, workspaceId);

        if (!agent) {
            new BadRequestException('Agent not found', 'AGENT_NOT_FOUND');
        }

        const result = await this.trainingEntryRepository.save({
            ...data,
            workspaceId,
            createdAt: new Date(),
            pendingTraining: true,
            botId: agent.botId,
        });

        return {
            data: result,
        };
    }

    public async updateTrainingEntry(
        workspaceId: string,
        data: UpdateTrainingEntry,
    ): Promise<DefaultResponse<TrainingEntry>> {
        const trainingEntry = await this.trainingEntryRepository.findOne({
            id: data.trainingEntryId,
            workspaceId,
        });

        if (!trainingEntry) {
            throw Exceptions.NOT_FOUND;
        }

        const result = await this.trainingEntryRepository.save({
            id: data.trainingEntryId,
            workspaceId,
            content: data.content,
            identifier: data.identifier,
            pendingTraining: true,
            updatedAt: new Date(),
        });

        return {
            data: result,
        };
    }

    public async deleteTrainingEntry(
        workspaceId: string,
        data: DeleteTrainingEntry,
    ): Promise<DefaultResponse<TrainingEntry>> {
        const trainingEntry = await this.trainingEntryRepository.findOne({
            id: data.trainingEntryId,
            workspaceId,
        });

        if (!trainingEntry) {
            throw Exceptions.NOT_FOUND;
        }

        const result = await this.trainingEntryRepository.save({
            id: data.trainingEntryId,
            workspaceId,
            pendingTraining: false,
            deletedAt: new Date(),
        });

        return {
            data: result,
        };
    }

    public async listTrainingEntries(workspaceId: string): Promise<DefaultResponse<TrainingEntry[]>> {
        const result = await this.trainingEntryRepository.find({
            where: {
                workspaceId,
                deletedAt: null,
            },
        });

        return {
            data: result,
        };
    }

    public async getTrainingEntry(
        workspaceId: string,
        data: GetTrainingEntry,
    ): Promise<DefaultResponse<TrainingEntry>> {
        const result = await this.trainingEntryRepository.findOne({
            where: {
                workspaceId,
                deletedAt: null,
                id: data.trainingEntryId,
            },
        });

        return {
            data: result || null,
        };
    }

    public async listTrainingEntriesContent(
        workspaceId: string,
        trainingEntryIds: string[],
    ): Promise<Pick<TrainingEntry, 'identifier' | 'content' | 'id'>[]> {
        if (!trainingEntryIds?.length) {
            return [];
        }

        const result = await this.trainingEntryRepository
            .createQueryBuilder('trainingEntry')
            .select(['trainingEntry.content', 'trainingEntry.identifier', 'id'])
            .where('trainingEntry.workspaceId = :workspaceId', { workspaceId })
            .andWhere('trainingEntry.id IN(:...trainingEntryIds)', { trainingEntryIds })
            .andWhere('trainingEntry.deletedAt IS NULL')
            .getMany();

        return result.map((result) => ({
            identifier: result.identifier,
            content: result.content,
            id: result.id,
        }));
    }

    public async listTrainingEntriesByAgentIdIdOrId(
        workspaceId: string,
        agentId: string,
        trainingEntryId?: string,
        force = false,
    ): Promise<TrainingEntry[]> {
        const query: FindManyOptions<TrainingEntry> = {
            where: {
                workspaceId,
                agentId,
                ...(trainingEntryId ? { id: trainingEntryId } : {}),
            },
        };

        if (!force) {
            query.where = Object.assign(query.where, { pendingTraining: true });
        }

        return await this.trainingEntryRepository.find(query);
    }

    public async updateTrainingEntryExecuted(workspaceId: string, trainingEntryId: string): Promise<void> {
        await this.trainingEntryRepository.save({
            id: trainingEntryId,
            workspaceId,
            pendingTraining: false,
            updatedAt: new Date(),
        });
    }
}
