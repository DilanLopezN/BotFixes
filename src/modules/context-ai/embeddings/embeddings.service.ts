import { Injectable, Logger } from '@nestjs/common';
import { CreateEmbedding } from './interfaces/create-embedding.interface';
import { DeleteEmbedding } from './interfaces/delete-embedding.interface';
import { clientOpenAI } from '../helpers/open-ai.instance';
import { Embeddings } from './interfaces/embeddings.interface';
import { TrainingEntryService } from '../training-entry/training-entry.service';
import { GetEmbeddingFromText } from './interfaces/embedding-from-text.interface';
import { DatabaseService } from '../helpers/database.service';

@Injectable()
export class EmbeddingsService {
    private logger: Logger = new Logger(EmbeddingsService.name);
    private embeddingModelName = 'text-embedding-3-small';

    constructor(
        private readonly trainingEntryService: TrainingEntryService,
        private readonly databaseService: DatabaseService,
    ) {}

    public prepareTextToEmbedding(text: string) {
        return text.trim().toLowerCase();
    }

    public async getEmbeddingFromText(content: string): Promise<GetEmbeddingFromText> {
        try {
            const openai = clientOpenAI();
            const response = await openai.embeddings.create({
                model: this.embeddingModelName,
                input: this.prepareTextToEmbedding(content),
            });

            return {
                embedding: response.data[0].embedding,
                tokens: response.usage.total_tokens,
            };
        } catch (error) {
            this.logger.error('EmbeddingsService.getEmbeddingFromText', error);
            throw error;
        }
    }

    public async createEmbeddings({
        content,
        trainingEntryId,
        workspaceId,
        embedding,
        totalTokens,
    }: CreateEmbedding): Promise<void> {
        try {
            if (!embedding) {
                const openai = clientOpenAI();
                const response = await openai.embeddings.create({
                    model: this.embeddingModelName,
                    input: this.prepareTextToEmbedding(content),
                });

                embedding = response.data[0].embedding;
                totalTokens = response.usage.total_tokens;
            }

            const query = `
                INSERT INTO context_ai.embeddings (
                    training_entry_id, created_at, embedding, deleted_at, updated_at, workspace_id, total_tokens
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7
                )
                ON CONFLICT (training_entry_id) 
                DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    deleted_at = EXCLUDED.deleted_at,
                    updated_at = EXCLUDED.updated_at,
                    total_tokens = EXCLUDED.total_tokens;
                `;

            await this.databaseService.execute(query, [
                trainingEntryId,
                new Date().toISOString(),
                `[${embedding}]`,
                null,
                null,
                workspaceId,
                totalTokens,
            ]);
        } catch (error) {
            this.logger.error('EmbeddingsService.createAndSaveEmbedding', error);
            throw error;
        }
    }

    public async deleteEmbedding({ trainingEntryId, workspaceId }: DeleteEmbedding): Promise<void> {
        const query = `
            UPDATE context_ai.embeddings
            SET deleted_at = $1
            WHERE training_entry_id = $2 AND workspace_id = $3;
        `;
        await this.databaseService.execute(query, [new Date().toISOString(), trainingEntryId, workspaceId]);
    }

    public async createEmbeddingsFromQuestion(question: string): Promise<number[]> {
        try {
            const openai = clientOpenAI();
            const responseData = await openai.embeddings.create({
                model: this.embeddingModelName,
                input: this.prepareTextToEmbedding(question),
            });

            return responseData.data[0].embedding;
        } catch (error) {
            this.logger.error('EmbeddingsService.createEmbeddingsFromQuestion', error);
            throw error;
        }
    }

    public async listEmbeddingsByWorkspaceId(
        workspaceId: string,
        questionEmbedding: number[],
    ): Promise<{ identifier: string; content: string }[]> {
        const query = `
            SELECT training_entry_id AS "trainingEntryId",
                embedding <=> $1::VECTOR AS similarity
            FROM context_ai.embeddings
            WHERE workspace_id = $2 
            AND deleted_at IS NULL
            AND embedding <=> $1::VECTOR <= $3
            ORDER BY similarity ASC
            LIMIT $4;
        `;

        // Quanto mais próximo de 0, mais similar
        const minimalSimilarity = 0.5;
        const maxResults = 10;

        const result = await this.databaseService.execute<Embeddings[]>(query, [
            `[${questionEmbedding}]`,
            workspaceId,
            minimalSimilarity,
            maxResults,
        ]);

        return await this.trainingEntryService.listTrainingEntriesContent(
            workspaceId,
            result.map((result) => result.trainingEntryId),
        );
    }
}
