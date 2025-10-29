import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../../_core/cache/cache.service';
import { IContextMessage } from '../../context-message/interfaces/context-message.interface';

@Injectable()
export class HistoricStorageService {
    private readonly logger: Logger = new Logger(HistoricStorageService.name);

    constructor(private readonly cacheService: CacheService) {}

    private getContextCacheKey(contextId: string): string {
        return `context_:${contextId}`;
    }

    public async createContextMessage(message: IContextMessage): Promise<IContextMessage> {
        const client = this.cacheService.getClient();
        const key = this.getContextCacheKey(message.contextId);

        await Promise.all([client.hset(key, message.id, JSON.stringify(message)), client.expire(key, 21_600)]);
        return message;
    }

    public async listContextMessages(contextId: string, size = 5): Promise<IContextMessage[]> {
        try {
            const client = this.cacheService.getClient();
            const key = this.getContextCacheKey(contextId);
            const results = await client.hgetall(key);

            const messages = Object.values(results)
                .map((value) => JSON.parse(value))
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            return messages.slice(0, Number(size));
        } catch (error) {
            this.logger.error('HistoricStorageService.listContextMessages', error);
            return [];
        }
    }
}
