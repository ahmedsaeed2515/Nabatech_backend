"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const env_1 = require("./config/env");
const outbox_worker_1 = require("./workers/outbox_worker");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./utils/logger");
const care_sync_worker_1 = require("./workers/care_sync_worker");
const ai_queue_1 = require("./queues/ai_queue");
const timelapse_worker_1 = require("./workers/timelapse_worker");
const TaskGenCron_1 = require("./crons/TaskGenCron");
const HealthScoreCron_1 = require("./crons/HealthScoreCron");
const outbreak_monitor_1 = require("./crons/outbreak_monitor");
const FollowUpCron_1 = require("./crons/FollowUpCron");
const WeatherRemindersCron_1 = require("./crons/WeatherRemindersCron");
const ReminderCron_1 = require("./crons/ReminderCron");
const WeatherCron_1 = require("./crons/WeatherCron");
const StreakCron_1 = require("./crons/StreakCron");
const HuggingFaceWarmupCron_1 = require("./crons/HuggingFaceWarmupCron");
// Ensure workers are registered (only if Redis is available)
care_sync_worker_1.careSyncWorker?.on('error', (err) => logger_1.logger.error('careSyncWorker error:', err));
ai_queue_1.aiAnalysisWorker?.on('error', (err) => logger_1.logger.error('aiAnalysisWorker error:', err));
timelapse_worker_1.timelapseWorker?.on('error', (err) => logger_1.logger.error('timelapseWorker error:', err));
const PORT = process.env.PORT || 10000;
const startServer = async () => {
    try {
        await (0, database_1.default)();
        if (env_1.env.DEPLOYMENT_MODE === 'single-instance' || env_1.env.DEPLOYMENT_MODE === 'multi-instance') {
            // In serverless mode, Vercel cron triggers the endpoint directly
            (0, outbox_worker_1.startOutboxPolling)(10000);
            logger_1.logger.info('Started outbox polling');
            // Start node-cron schedules
            TaskGenCron_1.TaskGenCron.start();
            (0, HealthScoreCron_1.startHealthScoreCron)();
            (0, outbreak_monitor_1.startOutbreakMonitor)();
            (0, FollowUpCron_1.startFollowUpCron)();
            (0, WeatherRemindersCron_1.startWeatherReminders)();
            ReminderCron_1.ReminderCron.start();
            WeatherCron_1.WeatherCron.start();
            StreakCron_1.StreakCron.start();
            (0, HuggingFaceWarmupCron_1.startHuggingFaceWarmupCron)(); // Keep HF Spaces warm to avoid cold starts
        }
        const server = app_1.default.listen(PORT, () => {
            logger_1.logger.info(`Server running on http://localhost:${PORT}`);
        });
        // Graceful Shutdown
        const shutdown = async (signal) => {
            logger_1.logger.info(`${signal} received: closing HTTP server`);
            (0, outbox_worker_1.stopOutboxPolling)();
            server.close(() => {
                logger_1.logger.info('HTTP server closed');
                mongoose_1.default.connection.close().then(() => {
                    logger_1.logger.info('MongoDB connection closed');
                    process.exit(0);
                });
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error("Failed to connect to database:", { error });
        process.exit(1);
    }
};
startServer(); // Trigger dev server reload to connect to MongoDB
