import { Request, Response, NextFunction } from 'express';
import redisClient, { isRedisAvailable } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Middleware to cache HTTP responses
 * @param durationInSeconds How long to cache the response
 */
export const cacheResponse = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis is not available
    if (!isRedisAvailable() || !redisClient) {
      return next();
    }

    // Create a unique key based on URL and query params
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
        return res.json(JSON.parse(cachedResponse));
      }

      res.setHeader('X-Cache', 'MISS');

      // Intercept the res.json method to capture the response body
      const originalJson = res.json.bind(res);
      
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient?.setex(key, durationInSeconds, JSON.stringify(body)).catch(err => {
            logger.warn(`Failed to cache response for ${key}:`, err);
          });
        }
        
        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.warn(`Redis cache middleware error for ${key}:`, err);
      next();
    }
  };
};

/**
 * Helper to generate Cache-Control headers without Redis caching
 * Good for static assets or resources that change rarely
 */
export const setCacheHeaders = (durationInSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
    }
    next();
  };
};
