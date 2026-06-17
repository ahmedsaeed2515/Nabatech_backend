import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// careSyncQueue is only available when REDIS_URL is set
let careSyncQueue: Queue | null = null;

const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  careSyncQueue = new Queue('care.sync', { connection: connection as any });
} else {
  console.warn('REDIS_URL not set – careSyncQueue disabled (serverless mode).');
}

export { careSyncQueue };
