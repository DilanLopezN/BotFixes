import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}
  public getClient(): Redis.Redis {
    try {
      return this.redisService.getClient();
    } catch (e) {
      console.log('error on getClient', e);
      return null;
    }
  }

  public async set(
    entity: any,
    key?: string,
    expiration: number = parseInt(process.env.REDIS_CACHE_EXPIRATION),
  ): Promise<void> {
    if (process.env.NODE_ENV == 'test') return null;
    try {
      const client = this.getClient();
      if (!client) return null;
      const _key = this.getKey(key, entity);
      if (_key && entity) {
        await client.set(_key, JSON.stringify(entity), 'EX', expiration || 240);
      }
    } catch (e) {
      console.log('cache set', e);
    }
  }

  public async get(key: string): Promise<any> {
    if (process.env.NODE_ENV == 'test') return null;
    try {
      const client = this.getClient();
      if (!client) return null;
      const _key = this.getKey(key);
      if (_key) {
        const d = await client.get(_key as string);
        if (d) return JSON.parse(d);
        else return null;
      }
      return null;
    } catch (e) {
      console.log('cache get', e);
    }
    return null;
  }

  public async remove(key: string): Promise<any> {
    if (process.env.NODE_ENV == 'test') return null;
    try {
      const client = this.getClient();
      if (!client) return null;
      const _key = this.getKey(key);
      if (_key) {
        return client.del(_key);
      }
      return null;
    } catch (e) {
      console.log('cache remove', e);
    }

    return null;
  }

  private getKey(key: string | string, entity?: any): string {
    let r: string = null;
    if (!key && !entity) {
      return null;
    } else if (key) {
      r = key.toString();
    } else if (entity) {
      r = entity._id.toString();
    }
    return r;
  }

  public async incr(key: string, expire: number = 2): Promise<number> {
    try {
      const client = this.getClient();
      if (!client) {
        return null;
      }
      const value = await client.incr(key);
      client.expire(key, expire);
      return value;
    } catch (e) {
      console.log('cache set', e);
    }
  }

  public async status(): Promise<boolean> {
    const client = this.getClient();
    if (!client) return null;
    const status = await client.ping('ping');
    return status && typeof status == 'string' && status === 'ping'
      ? true
      : false;
  }

  public async setObject(
    entity: Document | any,
    key?: string,
    redisExpiration?: number,
  ): Promise<void> {
    // if (process.env.NODE_ENV == 'development'
    //     || process.env.NODE_ENV == 'test') {
    //     return null;
    // }

    try {
      const client = await this.getClient();
      if (!client) {
        return null;
      }
      const _key = this.getKey(key, entity);
      if (_key && entity) {
        await client.set(
          _key,
          entity,
          'EX',
          redisExpiration || process.env.REDIS_CACHE_EXPIRATION || 120,
        );
      }
    } catch (e) {
      console.log('cache set', e);
    }
  }

  public async removeKeysByPattern(
    pattern: string,
    patternsToIgnore?: string[],
  ): Promise<void> {
    const prefix = 'API:';
    const integrationKeyPattern = `${prefix}${pattern}`;
    const client = this.getClient();

    const keys = await new Promise<string[]>((resolve, reject) => {
      client.keys(integrationKeyPattern, (err, keys) => {
        if (err) {
          reject(err);
        }

        if (!keys?.length) {
          return resolve([]);
        }

        if (patternsToIgnore?.length) {
          keys = keys.filter((key) => !patternsToIgnore.includes(key));
        }

        return resolve(keys);
      });
    });

    const pipeline = client.pipeline();

    keys.forEach(function (key) {
      pipeline.del(key.replace(`${prefix}`, ''));
    });

    pipeline.exec();
  }
}
