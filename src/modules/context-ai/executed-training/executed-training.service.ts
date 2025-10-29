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
        { forceAll, trainingEntryId, agentId }: DoTraining,
    ): Promise<DefaultResponse<{ success: number; total: number }>> {
        const trainingEntries = await this.trainingEntryService.listTrainingEntriesByAgentIdIdOrId(
            workspaceId,
            agentId,
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
        const batchSize = 20;

        // Processar deletions primeiro (sequencial)
        const deletedEntries = trainingEntries.filter((entry) => entry.deletedAt);
        for (const trainingEntry of deletedEntries) {
            await this.embeddingsService.deleteEmbedding({
                workspaceId: trainingEntry.workspaceId,
                trainingEntryId: trainingEntry.id,
            });
        }

        // Processar embeddings em lotes de 20 em paralelo
        const activeEntries = trainingEntries.filter((entry) => !entry.deletedAt);

        for (let i = 0; i < activeEntries.length; i += batchSize) {
            const batch = activeEntries.slice(i, i + batchSize);
            const batchPromises = batch.map(async (trainingEntry) => {
                try {
                    const { embedding, tokens } = await this.embeddingsService.getEmbeddingFromText(
                        trainingEntry.content,
                    );

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
                            agentId: trainingEntry.agentId,
                        });

                        // Atualiza com dados da sincronização
                        await queryRunner.manager.save(TrainingEntry, {
                            id: trainingEntry.id,
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

                        await queryRunner.commitTransaction();
                        return { success: true, id: trainingEntry.id };
                    } catch (error) {
                        console.error(`Error processing training entry ${trainingEntry.id}:`, error);
                        await queryRunner.rollbackTransaction();
                        return { success: false, id: trainingEntry.id, error };
                    } finally {
                        await queryRunner.release();
                    }
                } catch (error) {
                    console.error(`Error getting embedding for training entry ${trainingEntry.id}:`, error);
                    return { success: false, id: trainingEntry.id, error };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            const batchSuccessCount = batchResults.filter((result) => result.success).length;
            successTraining += batchSuccessCount;
        }

        return {
            data: {
                success: successTraining,
                total: activeEntries.length,
            },
        };
    }

    public async getConsumedTokens(
        workspaceId: string,
        { startDate, endDate, agentId }: GetConsumedTokens,
    ): Promise<DefaultResponse<GetConsumedTokensResponse[]>> {
        const query = this.executedTrainingRepository
            .createQueryBuilder()
            .where('workspace_id = :workspaceId', { workspaceId })
            .where('created_at::timestamp BETWEEN :startDate::timestamp AND :endDate::timestamp', {
                startDate: moment(startDate).startOf('day').toISOString(),
                endDate: moment(endDate).endOf('day').toISOString(),
            });

        if (agentId) {
            query.where('agent_id = :agentId', { agentId });
        }

        const result = await query
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
