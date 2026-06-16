import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { HealthEngineService } from '../services/HealthEngineService';
import { GamificationService } from '../services/GamificationService';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export const careSyncWorker = new Worker('care.sync', async (job) => {
  const { plantId, userId } = job.data;
  
  logger.info(`Processing care.sync for plant: ${plantId}`);
  
  const healthEngine = new HealthEngineService();
  await healthEngine.calculate(plantId, userId);

  const gamificationService = new GamificationService();
  const actionType = job.name === 'care.sync.action' ? 'WATER' : 'FERTILIZER'; // Extracted purely for default tracking if payload is minimal
  await gamificationService.awardXp(userId, actionType);
  
}, { connection: connection as any });

careSyncWorker.on('completed', job => {
  logger.info(`Job completed: care.sync ${job.id}`);
});

careSyncWorker.on('failed', (job, err) => {
  logger.error(`Job failed: care.sync ${job?.id}`, err);
});
