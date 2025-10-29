import { Injectable } from '@nestjs/common';
import { ContextAiImplementorService } from '../services/context-ai-implementor.service';
import { PendingMessage } from '../dto/pending-message.dto';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { ExecuteResponse } from '../interfaces/context-execute.interface';
import { CacheService } from '../../../_core/cache/cache.service';

@Injectable()
export class MessageAggregationStorageService {
    private readonly RATE_LIMIT_MS = 600;

    constructor(
        private readonly contextAiImplementorService: ContextAiImplementorService,
        private readonly cacheService: CacheService,
    ) {}

    async processQuestionWithAggregation(message: PendingMessage): Promise<DefaultResponse<ExecuteResponse>> {
        const bufferKey = `message_buffer:${message.contextId}`;
        // mensagem de áudio não precisa agregar pelo tempo de gravação
        // para texto, aplicar rate limit para agregar mensagens enviadas em sequência
        const rateLimit = message.fromAudio ? 0 : this.RATE_LIMIT_MS;

        try {
            const client = this.cacheService.getClient();
            const messageData = JSON.stringify({
                timestamp: message.timestamp.toISOString(),
                ...message,
            });

            const processingLockKey = `processing_lock:${message.contextId}`;
            const lockAcquired = await client.set(processingLockKey, message.messageId, 'PX', rateLimit + 1_000, 'NX');

            if (!lockAcquired) {
                await client.lpush(bufferKey, messageData);
                await client.expire(bufferKey, 5);

                throw {
                    statusCode: 409,
                    message: 'Message will be aggregated with previous message',
                    error: 'MESSAGE_AGGREGATED',
                };
            }

            await client.lpush(bufferKey, messageData);
            await client.expire(bufferKey, 5);

            await new Promise((resolve) => setTimeout(resolve, rateLimit));

            const messagesData = await client.lrange(bufferKey, 0, -1);

            if (messagesData.length === 0) {
                return await this.processMessage(message);
            }

            await client.del(bufferKey);
            await client.del(processingLockKey);

            // Parse e ordena em uma única passada, cache o timestamp já como number
            const messages = messagesData
                .map((data) => {
                    const parsed = JSON.parse(data);
                    parsed.timestampMs = new Date(parsed.timestamp).getTime();
                    return parsed;
                })
                .sort((a, b) => a.timestampMs - b.timestampMs);

            // TODO: Melhorar agregação de texto no futuro - considerar contexto, timestamps, e formatação inteligente
            const aggregatedText = messages.map((msg) => msg.text).join('\n');
            const firstMessage = messages[0];

            const result = await this.processMessage({
                ...firstMessage,
                text: aggregatedText,
            });

            return {
                ...result,
                data: {
                    ...result.data,
                    isAggregated: messages.length > 1,
                },
            };
        } catch (error) {
            if (error.statusCode === 409 && error.error === 'MESSAGE_AGGREGATED') {
                throw error;
            }

            return await this.processMessage(message);
        }
    }

    private async processMessage(message: PendingMessage): Promise<DefaultResponse<ExecuteResponse>> {
        const doQuestionData = {
            question: message.text,
            ...message,
        };

        return await this.contextAiImplementorService.doQuestion(doQuestionData);
    }
}
