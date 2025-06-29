import { Module } from '@nestjs/common';
import { RedisModule } from './../../../common/redis/redis.module';
import { CacheService } from './cache.service';

@Module({
  imports: [RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})

export class CacheModule { }
