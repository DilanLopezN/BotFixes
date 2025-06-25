import { Injectable } from '@nestjs/common';
import { CONTEXT_AI } from '../ormconfig';
import { Connection, Repository } from 'typeorm';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { DefaultResponse } from '../../../common/interfaces/default';
import { ExecutedTraining } from './executed-training.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import * as moment from 'moment';
import { EMBEDDING_MODEL_COST } from '../defaults';
import { TrainingEntryService } from '../training-entry/training-entry.service';
import { GetConsumedTokens, GetConsumedTokensResponse } from './interfaces/get-consumed-tokens';
import { DoTraining } from './interfaces/do-training.interface';
import { TrainingEntry } from '../training-entry/entities/training-entry.entity';

@Injectable()
export class ExecutedTrainingService {
    constructor(
        @InjectRepository(ExecutedTraining, CONTEXT_AI)
        public executedTrainingRepository: Repository<ExecutedTraining>,
        private readonly trainingEntryService: TrainingEntryService,
        private readonly embeddingsService: EmbeddingsService,
        @InjectConnection(CONTEXT_AI)
        private connection: Connection,
    ) {}

    public async doTraining(
        workspaceId: string,
        { forceAll, trainingEntryId }: DoTraining,
    ): Promise<DefaultResponse<{ success: number; total: number }>> {
        const trainingEntries = await this.trainingEntryService.listTrainingEntriesByWorkspaceIdOrId(
            workspaceId,
            trainingEntryId,
            forceAll,
        );

        if (!trainingEntries.length) {
            return {
                data: {
                    success: -1,
                    total: 0,
                },
            };
        }

        let successTraining = 0;

        for (const trainingEntry of trainingEntries) {
            if (trainingEntry.deletedAt) {
                await this.embeddingsService.deleteEmbedding({
                    workspaceId: trainingEntry.workspaceId,
                    trainingEntryId: trainingEntry.id,
                });
            } else {
                const { embedding, tokens } = await this.embeddingsService.getEmbeddingFromText(trainingEntry.content);

                const queryRunner = this.connection.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();

                try {
                    await queryRunner.manager.save(ExecutedTraining, {
                        content: trainingEntry.content,
                        createdAt: new Date(),
                        identifier: trainingEntry.identifier,
                        trainingEntryId: trainingEntry.id,
                        workspaceId: trainingEntry.workspaceId,
                        totalTokens: tokens,
                    });

                    await queryRunner.manager.save(TrainingEntry, {
                        id: trainingEntry.id,
                        workspaceId,
                        pendingTraining: false,
                        updatedAt: new Date(),
                        executedTrainingAt: new Date(),
                    });

                    const buildedContent = `${trainingEntry.identifier}\n${trainingEntry.content}`;

                    await this.embeddingsService.createEmbeddings({
                        content: buildedContent,
                        trainingEntryId: trainingEntry.id,
                        workspaceId,
                        embedding,
                        totalTokens: tokens,
                    });

                    successTraining++;
                    await queryRunner.commitTransaction();
                } catch (error) {
                    console.error(error);
                    await queryRunner.rollbackTransaction();
                } finally {
                    await queryRunner.release();
                }
            }
        }

        return {
            data: {
                success: successTraining,
                total: trainingEntries.filter((t) => !t.deletedAt).length,
            },
        };
    }

    public async getConsumedTokens(
        workspaceId: string,
        { startDate, endDate }: GetConsumedTokens,
    ): Promise<DefaultResponse<GetConsumedTokensResponse[]>> {
        const result = await this.executedTrainingRepository
            .createQueryBuilder()
            .where('workspace_id = :workspaceId', { workspaceId })
            .where('created_at::timestamp BETWEEN :startDate::timestamp AND :endDate::timestamp', {
                startDate: moment(startDate).startOf('day').toISOString(),
                endDate: moment(endDate).endOf('day').toISOString(),
            })
            .select("DATE_TRUNC('day', created_at)", 'date')
            .addSelect('SUM(total_tokens)', 'totalTokens')
            .groupBy("DATE_TRUNC('day', created_at)")
            .orderBy("DATE_TRUNC('day', created_at)")
            .getRawMany();

        return {
            data: result.map(({ totalTokens, ...data }) => ({
                ...data,
                totalTokens,
                totalTokensCost: (totalTokens / 1_000_000) * EMBEDDING_MODEL_COST,
            })),
        };
    }
}
