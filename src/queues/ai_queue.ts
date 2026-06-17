import { Worker } from 'bullmq';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';
import { AiOrchestratorService } from '../services/AiOrchestratorService';
import { AiReportRepository } from '../repositories/AiReportRepository';
import mongoose from 'mongoose';

export let aiAnalysisWorker: Worker | null = null;

if (redisClient) {
  const aiOrchestrator = new AiOrchestratorService();
  const aiReportRepo = new AiReportRepository();

  aiAnalysisWorker = new Worker('ai.analysis', async job => {
    if (job.name === 'analyzeGarden') {
      const { userId } = job.data;
      logger.info(`Starting AI Analysis for user ${userId}`);

      try {
        const reportData = await aiOrchestrator.analyzeGarden(userId);
        
        await aiReportRepo.create({
          user: new mongoose.Types.ObjectId(userId) as any,
          score: reportData.score,
          urgentActions: reportData.urgentActions,
          summary: reportData.summary
        });

        logger.info(`AI Analysis completed for user ${userId}`);
      } catch (error) {
        logger.error(`Error in ai.analysis for user ${userId}`, error);
        throw error;
      }
    }
  }, { connection: redisClient as any });

  aiAnalysisWorker.on('failed', (job, err) => {
    logger.error(`AI Analysis job ${job?.id} failed:`, err);
  });
} else {
  logger.warn('Redis unavailable – AI analysis worker disabled (serverless mode).');
}

