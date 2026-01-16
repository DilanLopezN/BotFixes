import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'mongoose';
import { ObjectId } from 'bson';
import { ConfigService } from '@nestjs/config';
import { sortBy } from 'lodash';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';
import { RedisManager } from '@liaoliaots/nestjs-redis';
import { redisNamespaces } from './cache.module';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    private readonly redisManager: RedisManager,
    private readonly configService: ConfigService,
  ) {}

  public getClient(namespace?: string): Redis {
    try {
      return this.redisManager.getClient(namespace ?? 'integrations');
    } catch (e) {
      this.logger.error('error on getClient', e);
      return null;
    }
  }

  public async expire(key: string, value: string | number) {
    const client = this.getClient();
    await client.expire(key, value);
  }

  public async set(entity: Document | any, key?: string | ObjectId, expiration?: number): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) {
        return null;
      }
      const _key = this.getKey(key, entity);
      if (_key && entity) {
        await client.set(
          _key,
          JSON.stringify(entity),
          'EX',
          expiration || this.configService.get<number>('cache.expiration'),
        );
      }
    } catch (e) {
      this.logger.error('cache hset', e);
    }
  }

  public async hset(entity: any, key: string | ObjectId, subKey: string | ObjectId): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) {
        return null;
      }

      if (key && entity) {
        await client.hset(key.toString(), subKey.toString(), JSON.stringify(entity));
      }
    } catch (e) {
      this.logger.error('cache set', e);
    }
  }

  public async hget(key: string | ObjectId, subKey: string | ObjectId): Promise<any> {
    try {
      const client = this.getClient();
      if (!client) {
        return null;
      }

      const data = await client.hget(key.toString(), subKey.toString());
      return data ? JSON.parse(data) : null;
    } catch (e) {
      this.logger.error('cache set', e);
    }
  }

  public async get(key: string | ObjectId): Promise<any> {
    try {
      const client = this.getClient();
      if (!client) {
        return null;
      }
      const _key = this.getKey(key);
      if (_key) {
        const data = await client.get(_key as string);
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch (e) {
      this.logger.error('cache hget', e);
    }
    return null;
  }

  public async remove(key: string | ObjectId): Promise<any> {
    try {
      const client = this.getClient();
      if (!client) {
        return null;
      }
      const _key = this.getKey(key);
      if (_key) {
        return client.del(_key);
      }
      return null;
    } catch (e) {
      this.logger.error('cache remove', e);
    }

    return null;
  }

  private getKey(key: string | string | ObjectId, entity?: Document): string {
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

  public async status(): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      return null;
    }
    const status = await client.ping('ping');
    return status && typeof status == 'string' && status === 'ping' ? true : false;
  }

  public createCustomKey(identifier: string, value: string | { [key: string]: string }) {
    if (typeof value === 'string') {
      return `${identifier}:${value}`;
    }

    const key = sortBy(Object.values(value ?? {})).join('');
    return `${identifier}:${crypto.createHash('md5').update(key).digest('hex')}`;
  }

  public async removeKeysByPattern(
    pattern: string,
    patternsToIgnore?: string[],
    defaultNamespace = redisNamespaces.integrations.namespace,
  ): Promise<void> {
    const { prefix, namespace } = redisNamespaces[defaultNamespace];
    const integrationKeyPattern = `${prefix}${pattern}`;
    const client = this.getClient(namespace);

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

  public async getTTL(key: string): Promise<number> {
    const client = this.getClient();

    if (!client) {
      return null;
    }

    return client.ttl(key);
  }
}
