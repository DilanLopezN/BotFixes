import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'core/cache/cache.service';

@Injectable()
export class SapCacheService {
  private readonly logger = new Logger(SapCacheService.name);
  constructor(private readonly cacheService: CacheService) {}

  public getCache(hash: string, subKey: string): Promise<any> {
    try {
      const key = `sap-integration:${hash}`;
      return this.cacheService.hget(key, subKey);
    } catch (error) {
      this.logger.error(`SapCacheService.${this.getCache.name}`, error);
    }
  }

  public async setCache(hash: string, subKey: string, data: any): Promise<void> {
    try {
      const key = `sap-integration:${hash}`;
      const result = await this.cacheService.hset(data, key, subKey);
      const expireTimeInSeconds = 24 * 60 * 60;
      await this.cacheService.expire(key, expireTimeInSeconds);
      return result;
    } catch (error) {
      this.logger.error(`SapCacheService.${this.setCache.name}`, error);
    }
  }

  public clearCache(hash: string): Promise<void> {
    try {
      const key = `sap-integration:${hash}`;
      return this.cacheService.remove(key);
    } catch (error) {
      this.logger.error(`SapCacheService.${this.clearCache.name}`, error);
    }
  }
}
