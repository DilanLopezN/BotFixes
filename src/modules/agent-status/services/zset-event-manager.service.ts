import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../_core/cache/cache.service';

export enum EventType {
    LAST_ACCESS = 'LAST_ACCESS',
    BREAK_EXPIRATION = 'BREAK_EXPIRATION',
}

export interface ZSetEvent {
    type: EventType;
    workspaceId: string;
    userId: string;
    timestamp: number;
    payload?: any;
}

@Injectable()
export class ZSetEventManagerService {
    private readonly logger = new Logger(ZSetEventManagerService.name);
    private readonly ZSET_KEY_PREFIX = 'agent_status_events';

    constructor(private readonly cacheService: CacheService) {}

    private getZSetKey(): string {
        return this.ZSET_KEY_PREFIX;
    }

    private createEventKey(type: EventType, workspaceId: string, userId: string): string {
        return `${type}:${workspaceId}:${userId}`;
    }

    async addEvent(event: ZSetEvent): Promise<void> {
        try {
            const client = this.cacheService.getClient();
            const zsetKey = this.getZSetKey();
            const eventKey = this.createEventKey(event.type, event.workspaceId, event.userId);
            // Só guardar timestamp e payload
            const minimalEventData = JSON.stringify({
                timestamp: event.timestamp,
                payload: event.payload ?? null,
            });

            // O member fica: type:workspaceId:userId:{"timestamp":...,"payload":...}
            await client.zadd(
                zsetKey,
                event?.payload?.expirationTimestamp || event.timestamp,
                `${eventKey}:${minimalEventData}`,
            );

            this.logger.debug(`Event added to ZSet: ${eventKey} at ${event.timestamp}`);
        } catch (error) {
            this.logger.error('Error adding event to ZSet:', error);
            throw error;
        }
    }

    async removeEvent(type: EventType, workspaceId: string, userId: string): Promise<void> {
        try {
            const client = this.cacheService.getClient();
            const zsetKey = this.getZSetKey();
            const eventPrefix = this.createEventKey(type, workspaceId, userId) + ':';

            this.logger.debug(`start removeEvent ${eventPrefix}`);

            // usa ZSCAN para não carregar tudo
            let cursor = '0';
            const toRemove: string[] = [];

            do {
                const [nextCursor, results] = await client.zscan(
                    zsetKey,
                    cursor,
                    'MATCH',
                    `${eventPrefix}*`,
                    'COUNT',
                    100,
                );
                cursor = nextCursor;

                // results é [member1, score1, member2, score2...]
                for (let i = 0; i < results.length; i += 2) {
                    toRemove.push(results[i]);
                }
            } while (cursor !== '0');

            if (toRemove.length > 0) {
                await client.zrem(zsetKey, ...toRemove);
                this.logger.debug(`Removed ${toRemove.length} events for ${eventPrefix}`);
            }
        } catch (error) {
            this.logger.error('Error removing event from ZSet:', error);
            throw error;
        }
    }

    async getExpiredEvents(currentTimestamp: number = Date.now()): Promise<ZSetEvent[]> {
        try {
            const client = this.cacheService.getClient();
            if (!client) {
                this.logger.error('Redis client is null - cannot get expired events');
                return [];
            }
            const zsetKey = this.getZSetKey();

            // Busca eventos com score (timestamp) menor ou igual ao atual
            const expiredMembers = await client.zrangebyscore(zsetKey, '-inf', currentTimestamp);

            const events: ZSetEvent[] = [];
            for (const member of expiredMembers) {
                try {
                    // O formato é: EventType:workspaceId:userId:JSON
                    // Precisamos encontrar o JSON que está após o terceiro ':'
                    const parts = member.split(':');
                    if (parts.length >= 4) {
                        const type = parts[0] as EventType;
                        const workspaceId = parts[1];
                        const userId = parts[2];
                        const minimalEventDataStr = parts.slice(3).join(':');

                        const parsed = JSON.parse(minimalEventDataStr);

                        events.push({
                            type,
                            workspaceId,
                            userId,
                            timestamp: parsed.timestamp,
                            payload: parsed.payload,
                        });
                    }
                } catch (parseError) {
                    this.logger.warn(`Failed to parse event data: ${member}`);
                }
            }

            return events;
        } catch (error) {
            this.logger.error('Error getting expired events:', error);
            throw error;
        }
    }

    async addLastAccessEvent(
        workspaceId: string,
        userId: string,
        expirationTimestamp: number,
        timestamp: number,
    ): Promise<void> {
        const event: ZSetEvent = {
            type: EventType.LAST_ACCESS,
            workspaceId,
            userId,
            timestamp: timestamp,
            payload: {
                expirationTimestamp,
            },
        };

        // Remove evento anterior do mesmo tipo/usuário antes de adicionar novo
        await this.removeEvent(EventType.LAST_ACCESS, workspaceId, userId);
        await this.addEvent(event);
    }

    async addBreakExpirationEvent(
        workspaceId: string,
        userId: string,
        expirationTimestamp: number,
        payload?: any,
    ): Promise<void> {
        const event: ZSetEvent = {
            type: EventType.BREAK_EXPIRATION,
            workspaceId,
            userId,
            timestamp: expirationTimestamp,
            payload,
        };

        // Remove evento anterior do mesmo tipo/usuário antes de adicionar novo
        await this.removeEvent(EventType.BREAK_EXPIRATION, workspaceId, userId);
        await this.addEvent(event);
    }

    async getLastAccessEvent(workspaceId: string, userId: string): Promise<ZSetEvent | null> {
        try {
            const client = this.cacheService.getClient();
            const zsetKey = this.getZSetKey();
            const eventKey = this.createEventKey(EventType.LAST_ACCESS, workspaceId, userId);

            // Busca eventos que começam com o eventKey
            const members = await client.zrange(zsetKey, 0, -1, 'WITHSCORES');

            // members retorna [member1, score1, member2, score2, ...]
            for (let i = 0; i < members.length; i += 2) {
                const member = members[i];
                const score = parseFloat(members[i + 1]);

                if (member.startsWith(`${eventKey}:`)) {
                    try {
                        const parts = member.split(':');
                        if (parts.length >= 4) {
                            const type = parts[0] as EventType;
                            const workspaceId = parts[1];
                            const userId = parts[2];
                            const minimalEventDataStr = parts.slice(3).join(':');

                            const parsed = JSON.parse(minimalEventDataStr);
                            return {
                                type,
                                workspaceId,
                                userId,
                                timestamp: parsed.timestamp,
                                payload: parsed.payload,
                            };
                        }
                    } catch (parseError) {
                        this.logger.warn(`Failed to parse last access event: ${member}`);
                    }
                }
            }

            return null;
        } catch (error) {
            this.logger.error('Error getting last access event:', error);
            return null;
        }
    }

    async getLastAccessTimestamp(workspaceId: string, userId: string): Promise<number | null> {
        const event = await this.getLastAccessEvent(workspaceId, userId);
        return event ? event?.timestamp : null;
    }
}
