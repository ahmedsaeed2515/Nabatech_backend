import cron from 'node-cron';
import { PlantRepository } from '../repositories/PlantRepository';
import { CareActionRepository } from '../repositories/CareActionRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { CareActionType } from '../models/care_action_model';
import { TaskStatus } from '../models/task_model';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export class TaskGenCron {
  static start() {
    // Run at 00:00 every day
    cron.schedule('0 0 * * *', async () => {
      await TaskGenCron.execute();
    });
  }

  static async execute() {
    logger.info('Running TaskGenCron to generate daily tasks...');
      try {
        const plantRepo = new PlantRepository();
        const careRepo = new CareActionRepository();
        const taskRepo = new TaskRepository();

        // Get all active plants. For scalability in production, this should be paginated or streamed.
        const allPlants = await plantRepo.findAllWithDna();
        
        for (const plant of allPlants) {
          const lastCare = await careRepo.findRecentWatering(plant._id.toString());
          const lastWatered = lastCare?.date || plant.createdAt;
          
          // Assuming wateringFrequency is in days in PlantDna. We default to 7 days if not found.
          const freqDays = (plant as any).dna?.wateringFrequency || 7;
          
          const nextDueDate = new Date(lastWatered);
          nextDueDate.setDate(nextDueDate.getDate() + freqDays);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (nextDueDate <= today) {
            // Check if a PENDING task already exists for this plant today
            const hasPending = await taskRepo.checkPendingTask(plant._id.toString(), today);

            if (!hasPending) {
              await taskRepo.create({
                user: plant.user as any,
                plant: plant._id as any,
                title: `Water ${plant.name}`,
                dueDate: today,
                status: TaskStatus.PENDING
              });
              logger.info(`Generated water task for plant ${plant._id}`);
            }
          }
        }
      } catch (err) {
        logger.error('Error in TaskGenCron:', err);
      }
  }
}
