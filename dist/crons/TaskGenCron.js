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
                const lastCare = await careRepo.findRecentWatering(plant._id.toString());
                const lastWatered = lastCare?.date || plant.createdAt;
                // Assuming wateringFrequency is in days in PlantDna. We default to 7 days if not found.
                const freqDays = plant.dna?.wateringFrequency || 7;
                const nextDueDate = new Date(lastWatered);
                nextDueDate.setDate(nextDueDate.getDate() + freqDays);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (nextDueDate <= today) {
                    // Check if a PENDING task already exists for this plant today
                    const hasPending = await taskRepo.checkPendingTask(plant._id.toString(), today);
                    if (!hasPending) {
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
            }
        }
        catch (err) {
            logger_1.logger.error('Error in TaskGenCron:', err);
        }
    }
}
exports.TaskGenCron = TaskGenCron;
