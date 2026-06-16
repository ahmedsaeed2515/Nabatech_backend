import cron from 'node-cron';
import { logger } from '../utils/logger';
import { StreakRepository } from '../repositories/StreakRepository';

export class StreakCron {
  static start() {
    // Runs daily at 01:00
    cron.schedule('0 1 * * *', async () => {
      logger.info('Running StreakCron to reset stale streaks...');
      
      const streakRepo = new StreakRepository();
      
      try {
        const thresholdDate = new Date();
        thresholdDate.setHours(thresholdDate.getHours() - 48);

        await streakRepo.resetStaleStreaks(thresholdDate);
        logger.info('StreakCron executed successfully.');
      } catch (err) {
        logger.error('Error in StreakCron execution:', err);
      }
    });
  }
}
