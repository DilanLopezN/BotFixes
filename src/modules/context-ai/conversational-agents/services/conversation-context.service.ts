import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../common/redis/redis.service';
import { ConversationContext } from '../interfaces/conversational-agent.interface';
import * as Redis from 'ioredis';

@Injectable()
export class ConversationContextService {
    private readonly logger = new Logger(ConversationContextService.name);
    private readonly redis: Redis.Redis;

    private readonly CONTEXT_PREFIX = 'conv_agent_context:';
    private readonly CONTEXT_TTL = 60 * 60;

    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    async saveContext(contextId: string, context: ConversationContext): Promise<void> {
        const key = this.getContextKey(contextId);
        await this.redis.setex(key, this.CONTEXT_TTL, JSON.stringify(context));

        this.logger.log(
            `Saved conversation context for ${contextId}: agent=${context.agentId}, state=${context.state}`,
        );
    }

    async getContext(contextId: string): Promise<ConversationContext | null> {
        const key = this.getContextKey(contextId);
        const data = await this.redis.get(key);

        if (!data) {
            this.logger.debug(`No conversation context found for ${contextId}`);
            return null;
        }

        try {
            const context: ConversationContext = JSON.parse(data);

            const lastActivity = new Date(context.metadata?.lastActivityAt || 0);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

            if (diffMinutes > 60) {
                this.logger.log(
                    `Conversation context expired for ${contextId} (${diffMinutes.toFixed(1)} minutes old)`,
                );
                await this.clearContext(contextId);
                return null;
            }

            this.logger.debug(`Retrieved conversation context for ${contextId}: agent=${context.agentId}`);
            return context;
        } catch (error) {
            this.logger.error(`Error parsing conversation context for ${contextId}:`, error);
            await this.clearContext(contextId);
            return null;
        }
    }

    async clearContext(contextId: string): Promise<void> {
        const key = this.getContextKey(contextId);
        await this.redis.del(key);
        this.logger.log(`Cleared conversation context for ${contextId}`);
    }

    private getContextKey(contextId: string): string {
        return `${this.CONTEXT_PREFIX}${contextId}`;
    }
}
