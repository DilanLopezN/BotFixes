import { RateLimitMiddleware } from './rate-limit.middleware';
import { CacheService } from '../../../../core/cache/cache.service';
import { HttpException, HttpStatus } from '@nestjs/common';

const limit = 60;
const ttl = 300;

describe('RateLimitMiddleware', () => {
  let rateLimitMiddleware: RateLimitMiddleware;
  let mockCacheService: Partial<CacheService>;

  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      getTTL: jest.fn(),
    };
    rateLimitMiddleware = new RateLimitMiddleware(mockCacheService as CacheService);
  });

  it('should set seconds to live (TTL) correctly for the first request', async () => {
    (mockCacheService.get as jest.Mock).mockResolvedValueOnce(null);
    (mockCacheService.set as jest.Mock).mockResolvedValueOnce(undefined);

    const req = { ip: '127.0.0.1' } as any;
    const res = {} as any;
    const next = jest.fn();

    await rateLimitMiddleware.use(req, res, next);

    expect(mockCacheService.set).toHaveBeenCalledWith({ count: 1 }, 'rate-limit:127.0.0.1', ttl);
  });

  it('should increment request count for repeated requests', async () => {
    (mockCacheService.get as jest.Mock).mockResolvedValueOnce(JSON.stringify({ count: 5 }));
    (mockCacheService.getTTL as jest.Mock).mockResolvedValueOnce(50);

    const req = { ip: '127.0.0.1' } as any;
    const res = {} as any;
    const next = jest.fn();

    await rateLimitMiddleware.use(req, res, next);

    expect(mockCacheService.get).toHaveBeenCalledWith('rate-limit:127.0.0.1');
    expect(mockCacheService.set).toHaveBeenCalledWith({ count: 6 }, 'rate-limit:127.0.0.1', ttl);
    expect(next).toHaveBeenCalled();
  });

  it('should allow requests below the limit', async () => {
    (mockCacheService.get as jest.Mock).mockResolvedValueOnce(null);
    (mockCacheService.set as jest.Mock).mockResolvedValueOnce(undefined);

    const req = { ip: '127.0.0.1' } as any;
    const res = {} as any;
    const next = jest.fn();

    await rateLimitMiddleware.use(req, res, next);

    expect(mockCacheService.get).toHaveBeenCalledWith('rate-limit:127.0.0.1');
    expect(mockCacheService.set).toHaveBeenCalledWith({ count: 1 }, 'rate-limit:127.0.0.1', ttl);
    expect(next).toHaveBeenCalled();
  });

  it('should block requests exceeding the limit', async () => {
    (mockCacheService.get as jest.Mock).mockResolvedValueOnce(JSON.stringify({ count: limit }));
    (mockCacheService.getTTL as jest.Mock).mockResolvedValueOnce(30);

    const req = { ip: '127.0.0.1' } as any;
    const res = {} as any;
    const next = jest.fn();

    await expect(rateLimitMiddleware.use(req, res, next)).rejects.toThrow(HttpException);

    try {
      await rateLimitMiddleware.use(req, res, next);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getResponse()).toEqual({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Try again in 30 seconds',
      });
    }
  });

  it('should handle corrupted cache data gracefully', async () => {
    (mockCacheService.get as jest.Mock).mockResolvedValueOnce('{ invalid json format }');

    const req = { ip: '127.0.0.1' } as any;
    const res = {} as any;
    const next = jest.fn();

    await expect(rateLimitMiddleware.use(req, res, next)).rejects.toThrow(HttpException);

    try {
      await rateLimitMiddleware.use(req, res, next);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getResponse()).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error parsing rate limit data',
      });
    }
  });
});
