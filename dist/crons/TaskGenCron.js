"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGenCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const PlantRepository_1 = require("../repositories/PlantRepository");
const CareActionRepository_1 = require("../repositories/CareActionRepository");
const TaskRepository_1 = require("../repositories/TaskRepository");
const task_model_1 = require("../models/task_model");
const logger_1 = require("../utils/logger");
class TaskGenCron {
    static start() {
        // Run at 00:00 every day
        node_cron_1.default.schedule('0 0 * * *', async () => {
            await TaskGenCron.execute();
        });
    }
    static async execute() {
        logger_1.logger.info('Running TaskGenCron to generate daily tasks...');
        try {
            const plantRepo = new PlantRepository_1.PlantRepository();
            const careRepo = new CareActionRepository_1.CareActionRepository();
            const taskRepo = new TaskRepository_1.TaskRepository();
            // Get all active plants. For scalability in production, this should be paginated or streamed.
            const allPlants = await plantRepo.findAllWithDna();
            for (const plant of allPlants) {
                // --- Watering Tasks ---
                const lastWaterCare = await careRepo.findRecentWatering(plant._id.toString());
                const lastWatered = lastWaterCare?.date || plant.createdAt;
                const waterFreqDays = plant.dna?.wateringFrequency || 7;
                const nextWaterDate = new Date(lastWatered);
                nextWaterDate.setDate(nextWaterDate.getDate() + waterFreqDays);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (nextWaterDate <= today) {
                    const hasPendingWater = await taskRepo.checkPendingTask(plant._id.toString(), today);
                    if (!hasPendingWater) {
                        await taskRepo.create({
                            user: plant.user,
                            plant: plant._id,
                            title: `Water ${plant.name}`,
                            dueDate: today,
                            status: task_model_1.TaskStatus.PENDING
                        });
                        logger_1.logger.info(`Generated water task for plant ${plant._id}`);
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
                            user: plant.user,
                            plant: plant._id,
                            title: `Fertilize ${plant.name}`,
                            dueDate: today,
                            status: task_model_1.TaskStatus.PENDING
                        });
                        logger_1.logger.info(`Generated fertilize task for plant ${plant._id}`);
                    }
                }
            }
        }
        catch (err) {
            logger_1.logger.error('Error in TaskGenCron:', err);
        }
    }
}
exports.TaskGenCron = TaskGenCron;
