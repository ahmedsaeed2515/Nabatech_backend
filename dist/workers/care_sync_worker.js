"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.careSyncWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const HealthEngineService_1 = require("../services/HealthEngineService");
const GamificationService_1 = require("../services/GamificationService");
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.careSyncWorker = null;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    const connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    exports.careSyncWorker = new bullmq_1.Worker('care.sync', async (job) => {
        const { plantId, userId } = job.data;
        logger_1.logger.info(`Processing care.sync for plant: ${plantId}`);
        const healthEngine = new HealthEngineService_1.HealthEngineService();
        await healthEngine.calculate(plantId, userId);
        const gamificationService = new GamificationService_1.GamificationService();
        const actionType = job.name === 'care.sync.action' ? 'WATER' : 'FERTILIZER'; // Extracted purely for default tracking if payload is minimal
        await gamificationService.awardXp(userId, actionType);
    }, { connection: connection });
    exports.careSyncWorker.on('completed', job => {
        logger_1.logger.info(`Job completed: care.sync ${job.id}`);
    });
    exports.careSyncWorker.on('failed', (job, err) => {
        logger_1.logger.error(`Job failed: care.sync ${job?.id}`, err);
    });
}
else {
    logger_1.logger.warn('Redis unavailable – care.sync worker disabled (serverless mode).');
}
