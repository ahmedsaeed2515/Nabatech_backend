import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redisClient;
