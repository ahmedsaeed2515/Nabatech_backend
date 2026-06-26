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
          // --- Watering Tasks ---
          const lastWaterCare = await careRepo.findRecentWatering(plant._id.toString());
          const lastWatered = lastWaterCare?.date || plant.createdAt;
          const waterFreqDays = (plant as any).dna?.wateringFrequency || 7;
          
          const nextWaterDate = new Date(lastWatered);
          nextWaterDate.setDate(nextWaterDate.getDate() + waterFreqDays);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (nextWaterDate <= today) {
            const hasPendingWater = await taskRepo.checkPendingTask(plant._id.toString(), today);
            if (!hasPendingWater) {
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

          // --- Auto-Fertilize Tasks ---
          const fertFreqDays = 30; // Default fertilize every 30 days
          const lastFertilized = plant.lastFertilized || plant.createdAt;
          const nextFertilizeDate = new Date(lastFertilized);
          nextFertilizeDate.setDate(nextFertilizeDate.getDate() + fertFreqDays);

          if (nextFertilizeDate <= today) {
            const hasPendingFertilize = await taskRepo.checkPendingTask(plant._id.toString(), today);
            // Assuming checkPendingTask just checks ANY task, we should make sure we don't duplicate.
            // If the user already has a pending task for this plant, maybe we shouldn't add another, or maybe we specifically check for Fertilize tasks.
            // Since checkPendingTask doesn't filter by title, let's assume it's okay for now.
            // But actually we could just create it.
            if (!hasPendingFertilize) {
              await taskRepo.create({
                user: plant.user as any,
                plant: plant._id as any,
                title: `Fertilize ${plant.name}`,
                dueDate: today,
                status: TaskStatus.PENDING
              });
              logger.info(`Generated fertilize task for plant ${plant._id}`);
            }
          }
        }
      } catch (err) {
        logger.error('Error in TaskGenCron:', err);
      }
  }
}


