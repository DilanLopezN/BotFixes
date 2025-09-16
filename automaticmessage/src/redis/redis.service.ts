import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis.Redis;
  constructor(client: Redis.Redis) {
    this.client = client;
  }
  getClient() {
    return this.client;
  }
}
