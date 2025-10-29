import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CreateIntentLibraryData,
    DeleteIntentLibraryData,
    IIntentLibrary,
    ListIntentLibraryFilter,
    UpdateIntentLibraryData,
} from '../interfaces/intent-library.interface';
import { IntentLibrary } from '../entities/intent-library.entity';
import { CONTEXT_AI } from '../../ormconfig';

@Injectable()
export class IntentLibraryService {
    constructor(
        @InjectRepository(IntentLibrary, CONTEXT_AI)
        private readonly intentLibraryRepository: Repository<IntentLibrary>,
    ) {}

    public async create(data: CreateIntentLibraryData): Promise<IIntentLibrary> {
        const intentLibrary = this.intentLibraryRepository.create(data);
        return this.intentLibraryRepository.save(intentLibrary);
    }

    public async update(data: UpdateIntentLibraryData): Promise<IIntentLibrary> {
        const intentLibrary = await this.intentLibraryRepository.findOne({
            where: { id: data.intentLibraryId, deletedAt: null },
        });

        if (!intentLibrary) {
            throw new NotFoundException(`IntentLibrary with ID ${data.intentLibraryId} not found`);
        }

        const { intentLibraryId: _intentLibraryId, ...updateData } = data;

        Object.assign(intentLibrary, updateData);

        return this.intentLibraryRepository.save(intentLibrary);
    }

    public async delete(data: DeleteIntentLibraryData): Promise<{ ok: boolean }> {
        const intentLibrary = await this.intentLibraryRepository.findOne({
            where: { id: data.intentLibraryId, deletedAt: null },
        });

        if (!intentLibrary) {
            throw new NotFoundException(`IntentLibrary with ID ${data.intentLibraryId} not found`);
        }

        intentLibrary.deletedAt = new Date();
        await this.intentLibraryRepository.save(intentLibrary);

        return { ok: true };
    }

    public async findById(intentLibraryId: string): Promise<IIntentLibrary | null> {
        return this.intentLibraryRepository.findOne({
            where: { id: intentLibraryId, deletedAt: null },
        });
    }

    public async list(filter: ListIntentLibraryFilter): Promise<IIntentLibrary[]> {
        const query = this.intentLibraryRepository
            .createQueryBuilder('intentLibrary')
            .where('intentLibrary.deletedAt IS NULL')
            .orderBy('intentLibrary.name', 'ASC')
            .addOrderBy('intentLibrary.createdAt', 'DESC');

        if (filter.search) {
            query.andWhere(
                '(intentLibrary.name ILIKE :search OR intentLibrary.description ILIKE :search)',
                { search: `%${filter.search}%` },
            );
        }

        return query.getMany();
    }
}
