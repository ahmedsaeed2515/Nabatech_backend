import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Only connect to Redis if a URL is provided (e.g. not available on Vercel Hobby)
let redisClient: Redis | null = null;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  redisClient.connect().catch((err) => {
    console.error('Redis connect failed:', err.message);
    redisClient = null;
  });
} else {
  console.warn('REDIS_URL not set – Redis/BullMQ features disabled (serverless mode).');
}

export const isRedisAvailable = () => redisClient !== null;

export default redisClient;
