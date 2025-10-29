import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingEntryType } from './entities/training-entry-type.entity';
import { DefaultResponse } from '../../../common/interfaces/default';
import { CONTEXT_AI } from '../ormconfig';

@Injectable()
export class TrainingEntryTypeService {
    constructor(
        @InjectRepository(TrainingEntryType, CONTEXT_AI)
        private trainingEntryTypeRepository: Repository<TrainingEntryType>,
    ) {}

    async create(workspaceId: string, name: string): Promise<DefaultResponse<TrainingEntryType>> {
        if (!name || name.trim().length === 0) {
            throw new BadRequestException('Name is required');
        }

        const existingType = await this.trainingEntryTypeRepository.findOne({
            where: { name: name.trim(), workspaceId }
        });

        if (existingType) {
            throw new BadRequestException('Training entry type with this name already exists');
        }

        const trainingEntryType = this.trainingEntryTypeRepository.create({
            name: name.trim(),
            workspaceId
        });

        const result = await this.trainingEntryTypeRepository.save(trainingEntryType);

        return {
            data: result,
        };
    }

    async update(workspaceId: string, id: string, name: string): Promise<DefaultResponse<TrainingEntryType>> {
        if (!name || name.trim().length === 0) {
            throw new BadRequestException('Name is required');
        }

        const trainingEntryType = await this.trainingEntryTypeRepository.findOne({
            where: { id, workspaceId }
        });

        if (!trainingEntryType) {
            throw new BadRequestException('Training entry type not found');
        }

        const existingType = await this.trainingEntryTypeRepository.findOne({
            where: { name: name.trim(), workspaceId }
        });

        if (existingType && existingType.id !== id) {
            throw new BadRequestException('Training entry type with this name already exists');
        }

        trainingEntryType.name = name.trim();
        const result = await this.trainingEntryTypeRepository.save(trainingEntryType);

        return {
            data: result,
        };
    }

    async list(workspaceId: string): Promise<DefaultResponse<TrainingEntryType[]>> {
        const trainingEntryTypes = await this.trainingEntryTypeRepository.find({
            where: { workspaceId },
            order: { name: 'ASC' }
        });

        return {
            data: trainingEntryTypes,
        };
    }

    async getById(workspaceId: string, id: string): Promise<DefaultResponse<TrainingEntryType>> {
        const trainingEntryType = await this.trainingEntryTypeRepository.findOne({
            where: { id, workspaceId }
        });

        if (!trainingEntryType) {
            throw new BadRequestException('Training entry type not found');
        }

        return {
            data: trainingEntryType,
        };
    }

    async delete(workspaceId: string, id: string): Promise<DefaultResponse<TrainingEntryType>> {
        const trainingEntryType = await this.trainingEntryTypeRepository.findOne({
            where: { id, workspaceId }
        });

        if (!trainingEntryType) {
            throw new BadRequestException('Training entry type not found');
        }

        await this.trainingEntryTypeRepository.remove(trainingEntryType);

        return {
            data: trainingEntryType,
        };
    }
}