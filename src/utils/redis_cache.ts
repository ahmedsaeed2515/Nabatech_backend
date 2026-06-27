import redisClient, { isRedisAvailable } from '../config/redis';
import { logger } from './logger';

/**
 * Gets a value from cache or executes the fetcher function to get it, cache it, and return it.
 * @param key The cache key
 * @param ttlSeconds Time to live in seconds
 * @param fetcher Function that returns a Promise with the data to cache
 * @returns The cached or freshly fetched data
 */
export const getOrSetCache = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  // If Redis is not available, just bypass cache
  if (!isRedisAvailable() || !redisClient) {
    return await fetcher();
  }

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }
  } catch (err) {
    logger.warn(`Redis cache get error for key ${key}:`, err);
  }

  // Fetch fresh data
  const freshData = await fetcher();

  // Save to cache asynchronously without blocking the response
  if (freshData !== undefined && freshData !== null) {
    try {
      // Don't await, let it save in the background
      redisClient.setex(key, ttlSeconds, JSON.stringify(freshData)).catch(err => {
        logger.warn(`Redis cache set error for key ${key}:`, err);
      });
    } catch (err) {
      logger.warn(`Redis cache stringify error for key ${key}:`, err);
    }
  }

  return freshData;
};

/**
 * Invalidates a specific cache key
 * @param key The cache key to invalidate
 */
export const invalidateCache = async (key: string): Promise<void> => {
  if (!isRedisAvailable() || !redisClient) return;
  
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.warn(`Redis cache invalidation error for key ${key}:`, err);
  }
};

/**
 * Invalidates multiple cache keys by pattern (e.g. 'plant-library:*')
 * Note: Use cautiously in production as KEYS can block Redis
 * @param pattern The pattern to match
 */
export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  if (!isRedisAvailable() || !redisClient) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    logger.warn(`Redis cache pattern invalidation error for pattern ${pattern}:`, err);
  }
};
