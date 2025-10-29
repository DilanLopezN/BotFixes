import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../../common/redis/redis.service';
import { SkillSession, SkillSessionStatus } from '../interfaces/skill-session.interface';
import * as Redis from 'ioredis';

@Injectable()
export class SkillSessionService {
    private readonly logger = new Logger(SkillSessionService.name);
    private readonly redis: Redis.Redis;

    private readonly SESSION_PREFIX = 'skill_session:';
    private readonly SESSION_TTL = 30 * 60;

    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    async createSession(
        sessionId: string,
        skillName: string,
        initialStatus: SkillSessionStatus = SkillSessionStatus.STARTED,
    ): Promise<SkillSession> {
        const skillSession: SkillSession = {
            sessionId,
            skillName,
            status: initialStatus,
            collectedData: {},
            startedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            maxRetries: 3,
            currentRetries: 0,
        };

        const key = this.getSessionKey(sessionId);
        await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(skillSession));

        this.logger.log(`Created skill session: ${sessionId} for skill: ${skillName} with status: ${initialStatus}`);
        return skillSession;
    }

    async getActiveSession(sessionId: string): Promise<SkillSession | null> {
        const key = this.getSessionKey(sessionId);
        const data = await this.redis.get(key);

        if (!data) {
            return null;
        }

        try {
            const session: SkillSession = JSON.parse(data);

            const now = new Date();
            const lastActivity = new Date(session.lastActivityAt);
            const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

            if (diffMinutes > 30) {
                await this.clearSession(sessionId);
                return null;
            }

            return session;
        } catch (error) {
            this.logger.error(`Error parsing skill session ${sessionId}:`, error);
            await this.clearSession(sessionId);
            return null;
        }
    }

    async updateSession(sessionId: string, updates: Partial<SkillSession>): Promise<void> {
        const current = await this.getActiveSession(sessionId);
        if (!current) {
            throw new Error(`No active skill session found for: ${sessionId}`);
        }

        const updated: SkillSession = {
            ...current,
            ...updates,
            lastActivityAt: new Date().toISOString(),
        };

        const key = this.getSessionKey(sessionId);
        await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(updated));
    }

    async clearSession(sessionId: string): Promise<void> {
        const key = this.getSessionKey(sessionId);
        await this.redis.del(key);
    }

    async isSessionActive(sessionId: string): Promise<boolean> {
        const session = await this.getActiveSession(sessionId);
        return session !== null && session.status !== 'completed' && session.status !== 'cancelled';
    }

    async updateCollectedData(sessionId: string, data: Partial<SkillSession['collectedData']>): Promise<void> {
        const current = await this.getActiveSession(sessionId);
        if (!current) {
            throw new Error(`No active skill session found for: ${sessionId}`);
        }

        const updatedCollectedData = {
            ...current.collectedData,
            ...data,
        };

        await this.updateSession(sessionId, {
            collectedData: updatedCollectedData,
        });
    }

    private getSessionKey(sessionId: string): string {
        return `${this.SESSION_PREFIX}${sessionId}`;
    }
}
