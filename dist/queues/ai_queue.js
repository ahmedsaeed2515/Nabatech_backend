"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAnalysisWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = require("../utils/logger");
const AiOrchestratorService_1 = require("../services/AiOrchestratorService");
const AiReportRepository_1 = require("../repositories/AiReportRepository");
const mongoose_1 = __importDefault(require("mongoose"));
exports.aiAnalysisWorker = null;
if (redis_1.default) {
    const aiOrchestrator = new AiOrchestratorService_1.AiOrchestratorService();
    const aiReportRepo = new AiReportRepository_1.AiReportRepository();
    exports.aiAnalysisWorker = new bullmq_1.Worker('ai.analysis', async (job) => {
        if (job.name === 'analyzeGarden') {
            const { userId } = job.data;
            logger_1.logger.info(`Starting AI Analysis for user ${userId}`);
            try {
                const reportData = await aiOrchestrator.analyzeGarden(userId);
                await aiReportRepo.create({
                    user: new mongoose_1.default.Types.ObjectId(userId),
                    score: reportData.score,
                    urgentActions: reportData.urgentActions,
                    summary: reportData.summary
                });
                logger_1.logger.info(`AI Analysis completed for user ${userId}`);
            }
            catch (error) {
                logger_1.logger.error(`Error in ai.analysis for user ${userId}`, error);
                throw error;
            }
        }
    }, { connection: redis_1.default });
    exports.aiAnalysisWorker.on('failed', (job, err) => {
        logger_1.logger.error(`AI Analysis job ${job?.id} failed:`, err);
    });
}
else {
    logger_1.logger.warn('Redis unavailable – AI analysis worker disabled (serverless mode).');
}
