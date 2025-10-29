import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../common/redis/redis.service';
import * as Redis from 'ioredis';

export enum SessionStateType {
    CLARIFICATION = 'clarification',
    SKILL = 'skill',
    TOOL = 'tool',
    CONVERSATIONAL_AGENT = 'conversational_agent',
    CUSTOM = 'custom',
}

export interface SessionState<T = any> {
    contextId: string;
    type: SessionStateType;
    data: T;
    timestamp: number;
    ttl?: number;
}

export interface ClarificationState {
    question: string;
    originalMessage?: string;
    attempts: number;
    maxAttempts: number;
    firstAttemptTimestamp: number;
}

@Injectable()
export class SessionStateService {
    private readonly logger = new Logger(SessionStateService.name);
    private readonly redis: Redis.Redis;
    private readonly SESSION_PREFIX = 'session_state:';
    private readonly DEFAULT_TTL_SECONDS = 5 * 60;
    private readonly MAX_CLARIFICATION_ATTEMPTS = 2;

    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    public async setState<T = any>(
        contextId: string,
        type: SessionStateType,
        data: T,
        ttlSeconds?: number,
    ): Promise<void> {
        const state: SessionState<T> = {
            contextId,
            type,
            data,
            timestamp: Date.now(),
            ttl: (ttlSeconds || this.DEFAULT_TTL_SECONDS) * 1000,
        };

        const key = this.getKey(contextId, type);
        const ttl = ttlSeconds || this.DEFAULT_TTL_SECONDS;

        await this.redis.setex(key, ttl, JSON.stringify(state));

        this.logger.log(`[SessionState] Estado definido: ${contextId} (${type}) - TTL: ${ttl}s`);
    }

    public async getState<T = any>(contextId: string, type: SessionStateType): Promise<T | null> {
        const key = this.getKey(contextId, type);
        const data = await this.redis.get(key);

        if (!data) {
            return null;
        }

        try {
            const state: SessionState<T> = JSON.parse(data);
            return state.data;
        } catch (error) {
            this.logger.error(`[SessionState] Erro ao parsear estado ${contextId} (${type}):`, error);
            await this.redis.del(key);
            return null;
        }
    }

    public async hasState(contextId: string, type: SessionStateType): Promise<boolean> {
        const key = this.getKey(contextId, type);
        const exists = await this.redis.exists(key);
        return exists === 1;
    }

    public async clearState(contextId: string, type: SessionStateType): Promise<void> {
        const key = this.getKey(contextId, type);
        const deleted = await this.redis.del(key);

        if (deleted > 0) {
            this.logger.log(`[SessionState] Estado removido: ${contextId} (${type})`);
        }
    }

    public async updateState<T = any>(
        contextId: string,
        type: SessionStateType,
        partialData: Partial<T>,
    ): Promise<void> {
        const currentData = await this.getState<T>(contextId, type);

        if (!currentData) {
            this.logger.warn(`[SessionState] Tentativa de atualizar estado inexistente: ${contextId} (${type})`);
            return;
        }

        const updatedData = {
            ...currentData,
            ...partialData,
        };

        const key = this.getKey(contextId, type);
        const ttl = await this.redis.ttl(key);

        const ttlToUse = ttl > 0 ? ttl : this.DEFAULT_TTL_SECONDS;
        await this.setState(contextId, type, updatedData, ttlToUse);
    }

    private getKey(contextId: string, type: SessionStateType): string {
        return `${this.SESSION_PREFIX}${contextId}:${type}`;
    }

    private getKeyPattern(contextId: string): string {
        return `${this.SESSION_PREFIX}${contextId}:*`;
    }

    public async setClarificationState(contextId: string, question: string): Promise<void> {
        // Verifica se já existe um estado de clarificação
        const existingState = await this.getState<ClarificationState>(contextId, SessionStateType.CLARIFICATION);

        if (existingState) {
            // Incrementa tentativas
            const newAttempts = existingState.attempts + 1;

            this.logger.log(
                `[SessionState] Incrementando tentativas de clarificação: ${contextId} (${newAttempts}/${this.MAX_CLARIFICATION_ATTEMPTS})`,
            );

            await this.setState<ClarificationState>(contextId, SessionStateType.CLARIFICATION, {
                question,
                originalMessage: existingState.originalMessage,
                attempts: newAttempts,
                maxAttempts: this.MAX_CLARIFICATION_ATTEMPTS,
                firstAttemptTimestamp: existingState.firstAttemptTimestamp,
            });
        } else {
            // Primeira tentativa
            await this.setState<ClarificationState>(contextId, SessionStateType.CLARIFICATION, {
                question,
                attempts: 1,
                maxAttempts: this.MAX_CLARIFICATION_ATTEMPTS,
                firstAttemptTimestamp: Date.now(),
            });
        }
    }

    public async isWaitingForClarification(contextId: string): Promise<boolean> {
        return await this.hasState(contextId, SessionStateType.CLARIFICATION);
    }

    public async hasExceededClarificationAttempts(contextId: string): Promise<boolean> {
        const state = await this.getState<ClarificationState>(contextId, SessionStateType.CLARIFICATION);

        if (!state) {
            return false;
        }

        return state.attempts >= state.maxAttempts;
    }

    public async getClarificationState(contextId: string): Promise<ClarificationState | null> {
        return await this.getState<ClarificationState>(contextId, SessionStateType.CLARIFICATION);
    }

    public async getClarificationQuestion(contextId: string): Promise<string | null> {
        const state = await this.getState<ClarificationState>(contextId, SessionStateType.CLARIFICATION);
        return state?.question || null;
    }

    public async clearClarificationState(contextId: string): Promise<void> {
        await this.clearState(contextId, SessionStateType.CLARIFICATION);
    }

    public async hasActiveConversationalAgent(contextId: string): Promise<boolean> {
        return await this.hasState(contextId, SessionStateType.CONVERSATIONAL_AGENT);
    }

    public async setConversationalAgentState(contextId: string, agentId: string): Promise<void> {
        await this.setState<{ agentId: string }>(contextId, SessionStateType.CONVERSATIONAL_AGENT, { agentId });
    }

    public async clearConversationalAgentState(contextId: string): Promise<void> {
        await this.clearState(contextId, SessionStateType.CONVERSATIONAL_AGENT);
    }
}
