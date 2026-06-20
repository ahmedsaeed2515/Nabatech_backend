"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHealthScoreCron = void 0;
// FIX [TASK-6.4]: Auto-Update Health Score Daily
const node_cron_1 = __importDefault(require("node-cron"));
const plant_model_1 = __importDefault(require("../models/plant_model"));
const logger_1 = require("../utils/logger");
const startHealthScoreCron = () => {
    // Run daily at midnight
    node_cron_1.default.schedule('0 0 * * *', async () => {
        logger_1.logger.info('[CRON] Running daily health score update...');
        try {
            const plants = await plant_model_1.default.find({});
            for (const plant of plants) {
                if (!plant.lastWatered)
                    continue;
                const daysWithoutWater = Math.floor((Date.now() - new Date(plant.lastWatered).getTime()) / 86400000);
                // If unwatered for > 7 days, start degrading health score by 2 points per day
                if (daysWithoutWater > 7) {
                    plant.healthScore = Math.max(0, (plant.healthScore || 100) - 2);
                    await plant.save();
                    logger_1.logger.info(`[CRON] Degraded health score for plant ${plant.name} due to lack of water.`);
                }
            }
            logger_1.logger.info('[CRON] Daily health score update complete.');
        }
        catch (error) {
            logger_1.logger.error('[CRON] Failed to update health scores', error);
        }
    });
};
exports.startHealthScoreCron = startHealthScoreCron;
