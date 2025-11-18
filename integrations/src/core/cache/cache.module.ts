import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import cacheConfig from './cache.config';
import { RedisModule } from '@liaoliaots/nestjs-redis';

interface RedisNamespace {
  prefix: string;
  namespace: string;
}

export const redisNamespaces: { [key: string]: RedisNamespace } = {
  integrations: {
    prefix: 'INT:',
    namespace: 'integrations',
  },
  general: {
    prefix: 'API:',
    namespace: 'general',
  },
};

@Module({
  imports: [
    ConfigModule.forFeature(cacheConfig),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        config: [
          {
            namespace: redisNamespaces.integrations.namespace,
            reconnectOnError: () => true,
            retryStrategy: () => 1000,
            maxRetriesPerRequest: 50,
            keyPrefix: redisNamespaces.integrations.prefix,
            host: configService.get<string>('cache.redisHost'),
            port: configService.get<number>('cache.redisPort'),
            password: configService.get<string>('cache.redisPassword'),
          },
          {
            namespace: redisNamespaces.general.namespace,
            reconnectOnError: () => true,
            retryStrategy: () => 1000,
            maxRetriesPerRequest: 50,
            keyPrefix: redisNamespaces.general.prefix,
            host: configService.get<string>('cache.redisHost'),
            port: configService.get<number>('cache.redisPort'),
            password: configService.get<string>('cache.redisPassword'),
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
