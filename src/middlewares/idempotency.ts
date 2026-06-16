import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';

export const IdempotencyCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    return next();
  }

  const idempotencyKey = req.header('x-client-operation-id');
  if (!idempotencyKey) {
    return next();
  }

  const redisKey = `idemp:${idempotencyKey}`;

  try {
    const cachedResponse = await redisClient.get(redisKey);
    if (cachedResponse) {
      logger.info(`Idempotency key hit for ${idempotencyKey}`);
      const parsed = JSON.parse(cachedResponse);
      res.status(parsed.status).json(parsed.body);
      return;
    }

    // Override res.send to intercept and cache the response
    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
      const responseToCache = {
        status: res.statusCode,
        body: typeof body === 'string' ? JSON.parse(body) : body,
      };

      // TTL: 48h (48 * 60 * 60 = 172800)
      redisClient.set(redisKey, JSON.stringify(responseToCache), 'EX', 172800).catch((err: any) => {
        logger.error('Failed to cache idempotency response', err);
      });

      return originalSend(body);
    };

    next();
  } catch (error) {
    logger.error('Error checking idempotency', error);
    next();
  }
};
