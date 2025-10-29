import { Injectable, Logger } from '@nestjs/common';
import { CreateEmbedding } from './interfaces/create-embedding.interface';
import { DeleteEmbedding } from './interfaces/delete-embedding.interface';
import { clientOpenAI } from '../ai-provider/helpers/open-ai.instance';
import { Embeddings } from './interfaces/embeddings.interface';
import { TrainingEntryService } from '../training-entry/training-entry.service';
import { GetEmbeddingFromText } from './interfaces/embedding-from-text.interface';
import { DatabaseService } from '../helpers/database.service';
import { normalizeText } from './helpers/stop-words';

@Injectable()
export class EmbeddingsService {
    private logger: Logger = new Logger(EmbeddingsService.name);
    private embeddingModelName = 'text-embedding-3-small';

    constructor(
        private readonly trainingEntryService: TrainingEntryService,
        private readonly databaseService: DatabaseService,
    ) {}

    public prepareTextToEmbedding(text: string): string {
        return normalizeText(text);
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
                new Date().toISOString(),
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
            const preparedQuestion = this.prepareTextToEmbedding(question);

            const responseData = await openai.embeddings.create({
                model: this.embeddingModelName,
                input: preparedQuestion,
            });

            return responseData.data[0].embedding;
        } catch (error) {
            this.logger.error('EmbeddingsService.createEmbeddingsFromQuestion', error);
            throw error;
        }
    }

    public async listEmbeddingsByAgentId(
        agentId: string,
        workspaceId: string,
        questionEmbedding: number[],
        options: { maxResults?: number; minSimilarity?: number } = {},
    ): Promise<{ identifier: string; content: string; id: string; similarity?: number }[]> {
        const query = `
            SELECT e.training_entry_id AS "trainingEntryId",
                e.embedding <=> $1::VECTOR AS similarity
            FROM context_ai.embeddings e
            INNER JOIN context_ai.training_entry te ON e.training_entry_id::UUID = te.id::UUID
            WHERE te.agent_id::UUID = $2::UUID
            AND e.deleted_at IS NULL
            AND te.deleted_at IS NULL
            AND te.is_active = true
            AND (te.expires_at IS NULL OR te.expires_at > NOW())
            AND e.embedding <=> $1::VECTOR <= $3
            ORDER BY similarity ASC
            LIMIT $4;
        `;

        // Quanto mais próximo de 0, mais similar
        // Pode ser uma variável customizada futuramente
        const minimalSimilarity = options.minSimilarity ?? 0.5;
        const maxResults = options.maxResults ?? 15;

        const result = await this.databaseService.execute<Embeddings[]>(query, [
            `[${questionEmbedding}]`,
            agentId,
            minimalSimilarity,
            maxResults,
        ]);

        if (!result?.length) {
            return [];
        }

        const trainingEntries = await this.trainingEntryService.listTrainingEntriesContent(
            workspaceId,
            agentId,
            result.map((result) => result.trainingEntryId),
        );

        return trainingEntries.map((entry) => {
            const embeddingResult = result.find((r) => r.trainingEntryId === entry.id);
            return {
                ...entry,
                similarity: embeddingResult?.similarity ?? undefined,
            };
        });
    }
}
