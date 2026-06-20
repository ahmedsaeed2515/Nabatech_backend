// FIX [TASK-6.4]: Auto-Update Health Score Daily
import cron from 'node-cron';
import PlantModel from '../models/plant_model';
import { logger } from '../utils/logger';

export const startHealthScoreCron = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Running daily health score update...');
    try {
      const plants = await PlantModel.find({});
      for (const plant of plants) {
        if (!plant.lastWatered) continue;
        
        const daysWithoutWater = Math.floor((Date.now() - new Date(plant.lastWatered).getTime()) / 86_400_000);
        
        // If unwatered for > 7 days, start degrading health score by 2 points per day
        if (daysWithoutWater > 7) {
          plant.healthScore = Math.max(0, (plant.healthScore || 100) - 2);
          await plant.save();
          logger.info(`[CRON] Degraded health score for plant ${plant.name} due to lack of water.`);
        }
      }
      logger.info('[CRON] Daily health score update complete.');
    } catch (error) {
      logger.error('[CRON] Failed to update health scores', error);
    }
  });
};
