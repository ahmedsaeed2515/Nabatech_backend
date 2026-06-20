"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFollowUpCron = void 0;
// FIX [TASK-7.3]: Send follow-up reminders for past diagnoses
const node_cron_1 = __importDefault(require("node-cron"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const NotificationService_1 = require("../services/NotificationService");
const logger_1 = require("../utils/logger");
const startFollowUpCron = () => {
    node_cron_1.default.schedule('0 9 * * *', async () => {
        logger_1.logger.info('[CRON] Running follow-up reminders...');
        try {
            const overdue = await diagnosis_history_model_1.default.find({
                followUpDate: { $lte: new Date() },
                followUpCompleted: { $ne: true }
            }).populate('user', 'fcmToken name').lean();
            const notificationService = new NotificationService_1.NotificationService();
            for (const diagnosis of overdue) {
                const user = diagnosis.user;
                if (!user?.fcmToken)
                    continue;
                await notificationService.sendPushNotification(user.fcmToken, {
                    notification: {
                        title: '🌱 Plant Follow-Up',
                        body: `How is your plant doing after the ${diagnosis.diseaseNameEn} treatment? Tap to update.`
                    },
                    data: { diagnosisId: diagnosis._id.toString(), action: 'FOLLOW_UP', type: 'WATERING_REMINDER' }
                }, { userId: user._id.toString(), type: 'GENERAL' });
                // Mark as sent (not completed) to avoid re-sending
                await diagnosis_history_model_1.default.findByIdAndUpdate(diagnosis._id, {
                    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Reschedule 7 days if no response
                });
            }
            logger_1.logger.info('[CRON] Follow-up reminders complete.');
        }
        catch (err) {
            logger_1.logger.error('[CRON] Follow-up reminders failed:', err);
        }
    });
};
exports.startFollowUpCron = startFollowUpCron;
