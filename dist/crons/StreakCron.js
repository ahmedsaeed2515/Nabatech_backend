"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../utils/logger");
const StreakRepository_1 = require("../repositories/StreakRepository");
class StreakCron {
    static start() {
        // Runs daily at 01:00
        node_cron_1.default.schedule('0 1 * * *', async () => {
            logger_1.logger.info('Running StreakCron to reset stale streaks...');
            const streakRepo = new StreakRepository_1.StreakRepository();
            try {
                const thresholdDate = new Date();
                thresholdDate.setHours(thresholdDate.getHours() - 48);
                await streakRepo.resetStaleStreaks(thresholdDate);
                logger_1.logger.info('StreakCron executed successfully.');
            }
            catch (err) {
                logger_1.logger.error('Error in StreakCron execution:', err);
            }
        });
    }
}
exports.StreakCron = StreakCron;
