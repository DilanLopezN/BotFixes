import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Team } from '../interfaces/team.interface';
import { CacheService } from '../../_core/cache/cache.service';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TeamCacheService {
    constructor(
        @InjectModel('Team') protected readonly model: Model<Team>,
        protected readonly cacheService: CacheService,
    ) {}

    async getFromCache(teamId: string, workspaceId: string): Promise<Team | null> {
        const cacheKey = this.getCacheKey(teamId, workspaceId);

        const cachedTeam = await this.cacheService.get(cacheKey);
        if (cachedTeam) return cachedTeam as Team;

        return null;
    }

    async saveToCache(team: Team, workspaceId: string): Promise<void> {
        const cacheKey = this.getCacheKey(team._id.toString(), workspaceId);
        await this.cacheService.set(team, cacheKey, parseInt(process.env.REDIS_CACHE_EXPIRATION));
    }

    private getCacheKey(teamId: string, workspaceId: string): string {
        return `team:${teamId}:${workspaceId}`;
    }

    async deleteFromCache(teamId: string, workspaceId: string): Promise<void> {
        const cacheKey = this.getCacheKey(teamId, workspaceId);
        await this.cacheService.remove(cacheKey);
    }
}
