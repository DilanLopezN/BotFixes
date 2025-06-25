import { Injectable } from '@nestjs/common';
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

@Injectable()
export class TrainingEntryService {
    constructor(
        @InjectRepository(TrainingEntry, CONTEXT_AI)
        public trainingEntryRepository: Repository<TrainingEntry>,
    ) {}

    public async createTrainingEntry(
        workspaceId: string,
        data: CreateTrainingEntry,
    ): Promise<DefaultResponse<TrainingEntry>> {
        const result = await this.trainingEntryRepository.save({
            ...data,
            workspaceId,
            createdAt: new Date(),
            pendingTraining: true,
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
            botId: data.botId,
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
    ): Promise<Pick<TrainingEntry, 'identifier' | 'content'>[]> {
        if (!trainingEntryIds?.length) {
            return [];
        }

        const result = await this.trainingEntryRepository
            .createQueryBuilder('trainingEntry')
            .select(['trainingEntry.content', 'trainingEntry.identifier'])
            .where('trainingEntry.workspaceId = :workspaceId', { workspaceId })
            .andWhere('trainingEntry.id IN(:...trainingEntryIds)', { trainingEntryIds })
            .andWhere('trainingEntry.deletedAt IS NULL')
            .getMany();

        return result.map((result) => ({
            identifier: result.identifier,
            content: result.content,
        }));
    }

    public async listTrainingEntriesByWorkspaceIdOrId(
        workspaceId: string,
        trainingEntryId?: string,
        force = false,
    ): Promise<TrainingEntry[]> {
        const query: FindManyOptions<TrainingEntry> = {
            where: {
                workspaceId,
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
