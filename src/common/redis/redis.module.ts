import { Module } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { RedisService } from './redis.service';

@Module({
    providers: [
        {
            provide: RedisService,
            useFactory: async () => {
                const redisConfig: RedisOptions = {
                    host: process.env.REDIS_HOST_ELASTICACHE || process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
                    maxRetriesPerRequest: 1,
                    keyPrefix: 'API:',
                    reconnectOnError: () => true,
                    retryStrategy: () => 1000,
                } 
                if (process.env.REDIS_HOST == redisConfig.host) {
                    redisConfig.password = process.env.REDIS_PASSWORD;
                }
                const client = new Redis(redisConfig);
                return new RedisService(client);
            },  
        }
    ],
    exports: [RedisService]
})
export class RedisModule {}