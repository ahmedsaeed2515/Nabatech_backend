import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// timelapseQueue is only available when REDIS_URL is set
let timelapseQueue: Queue | null = null;

const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  timelapseQueue = new Queue('timelapse.generate', { connection: connection as any });
} else {
  console.warn('REDIS_URL not set – timelapseQueue disabled (serverless mode).');
}

export { timelapseQueue };


