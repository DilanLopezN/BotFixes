import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'core/cache/cache.service';
import { ListSchedulesResumeResponse } from '../../interfaces/schedule-resume.interface';

const CACHE_EXPIRATION = 60;

@Injectable()
export class SchedulingCacheService {
  private readonly PATH = 'scheduling:schedules';
  private readonly logger = new Logger(SchedulingCacheService.name);
  constructor(private readonly cacheService: CacheService) {}

  public getScheduleCache(hash: string): Promise<ListSchedulesResumeResponse> {
    try {
      const key = `${this.PATH}:${hash}`;
      return this.cacheService.get(key);
    } catch (error) {
      this.logger.error(`SchedulingCacheService.${this.getScheduleCache.name}`, error);
    }
  }

  public async setScheduleCache(hash: string, data: ListSchedulesResumeResponse): Promise<void> {
    try {
      if (!data?.schedules?.length) {
        return await this.deleteScheduleCache(hash);
      }

      const key = `${this.PATH}:${hash}`;
      return this.cacheService.set(data, key, CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error(`SchedulingCacheService.${this.setScheduleCache.name}`, error);
    }
  }

  public async deleteScheduleCache(hash: string): Promise<void> {
    try {
      const key = `${this.PATH}:${hash}`;
      return this.cacheService.remove(key);
    } catch (error) {
      this.logger.error(`SchedulingCacheService.${this.deleteScheduleCache.name}`, error);
    }
  }
}
