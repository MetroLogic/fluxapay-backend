import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

export const createApiKeyRateLimiter = (options: {
  capacity?: number;
  refillRatePerSec?: number;
}) => {
  const capacity = options.capacity ?? 60;
  const refillRatePerSec = options.refillRatePerSec ?? 10;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = (req.headers['x-api-key'] as string) || req.ip || 'anonymous';
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, lastRefill: now };
      buckets.set(key, bucket);
    } else {
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillRatePerSec);
      bucket.lastRefill = now;
    }

    if (bucket.tokens < 1) {
      res.setHeader('Retry-After', Math.ceil(1 / refillRatePerSec));
      return next(new AppError('API key rate limit exceeded. Please throttle requests.', 429));
    }

    bucket.tokens -= 1;
    res.setHeader('X-RateLimit-Limit', capacity);
    res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
    next();
  };
};
