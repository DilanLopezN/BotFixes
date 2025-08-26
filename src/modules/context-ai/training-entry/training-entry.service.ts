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
import * as XLSX from 'xlsx';

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

    public async listTrainingEntries(workspaceId: string, agentId: string): Promise<DefaultResponse<TrainingEntry[]>> {
        const result = await this.trainingEntryRepository.find({
            where: {
                workspaceId,
                agentId,
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

    public async bulkUploadTrainingEntries(
        workspaceId: string,
        agentId: string,
        fileBuffer: Buffer,
        filename: string,
    ): Promise<DefaultResponse<{ created: number; errors: string[] }>> {
        const agent = await this.agentService.findByWorkspaceIdAndId(agentId, workspaceId);
        if (!agent) {
            throw new BadRequestException('Agent not found', 'AGENT_NOT_FOUND');
        }

        let rows: any[] = [];
        const errors: string[] = [];

        try {
            const fileExtension = filename.split('.').pop()?.toLowerCase();

            if (fileExtension === 'csv') {
                const csvContent = fileBuffer.toString('utf-8');
                const lines = csvContent.split('\n');

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        const columns = this.parseCsvLine(line);
                        if (columns.length >= 2) {
                            rows.push({
                                identifier: columns[0]?.trim(),
                                content: columns[1]?.trim(),
                            });
                        }
                    }
                }
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as any[];
                    if (row && row.length >= 2) {
                        rows.push({
                            identifier: row[0]?.toString()?.trim(),
                            content: row[1]?.toString()?.trim(),
                        });
                    }
                }
            } else {
                throw new BadRequestException('Unsupported file format. Only CSV and Excel files are supported.');
            }

            const validRows = rows.filter((row, index) => {
                if (!row.identifier || !row.content) {
                    errors.push(`Row ${index + 2}: Missing identifier or content`);
                    return false;
                }
                if (row.identifier.length > 180) {
                    errors.push(`Row ${index + 2}: Identifier too long (max 180 characters)`);
                    return false;
                }
                if (row.content.length > 1000) {
                    errors.push(`Row ${index + 2}: Content too long (max 1000 characters)`);
                    return false;
                }
                return true;
            });

            const trainingEntries = validRows.map((row) => ({
                identifier: row.identifier,
                content: row.content,
                workspaceId,
                agentId,
                pendingTraining: true,
                createdAt: new Date(),
            }));

            if (trainingEntries.length > 0) {
                await this.trainingEntryRepository.save(trainingEntries);
            }

            return {
                data: {
                    created: trainingEntries.length,
                    errors,
                },
            };
        } catch (error) {
            console.error('Error processing bulk upload:', error);
            throw new BadRequestException('Error processing file: ' + error.message);
        }
    }

    private parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }
}
