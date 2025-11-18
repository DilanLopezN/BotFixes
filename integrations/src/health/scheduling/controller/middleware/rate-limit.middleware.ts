import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../../../../core/cache/cache.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limitRequests = 60;
  private readonly secondsToLive = 300;

  constructor(private readonly cacheService: CacheService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const clientIp = req.ip;
    const cacheKey = `rate-limit:${clientIp}`;

    const cachedRequestCount = await this.cacheService.get(cacheKey);

    let remainingTime: number;
    let requestCount: number;

    if (!cachedRequestCount) {
      await this.cacheService.set({ count: 1 }, cacheKey, this.secondsToLive);

      requestCount = 1;
      remainingTime = this.secondsToLive;
    } else {
      let count: number;

      try {
        ({ count } = cachedRequestCount);
      } catch (error) {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error parsing rate limit data',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      requestCount = count + 1;
      remainingTime = await this.cacheService.getTTL(cacheKey);

      await this.cacheService.set({ count: requestCount }, cacheKey, this.secondsToLive);
    }

    if (requestCount > this.limitRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Try again in ${remainingTime} seconds`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
