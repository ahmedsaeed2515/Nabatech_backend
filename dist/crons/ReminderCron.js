"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const TaskRepository_1 = require("../repositories/TaskRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const NotificationService_1 = require("../services/NotificationService");
const logger_1 = require("../utils/logger");
class ReminderCron {
    static start() {
        // Run every 15 minutes
        node_cron_1.default.schedule('*/15 * * * *', async () => {
            logger_1.logger.info('Running ReminderCron to send push notifications...');
            try {
                const taskRepo = new TaskRepository_1.TaskRepository();
                const userRepo = new UserRepository_1.UserRepository();
                const notificationService = new NotificationService_1.NotificationService();
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                // Find pending tasks for today
                const pendingTasks = await taskRepo.findPendingForToday(todayStart, todayEnd);
                // Group tasks by user
                const tasksByUser = {};
                for (const task of pendingTasks) {
                    const uid = task.user.toString();
                    if (!tasksByUser[uid])
                        tasksByUser[uid] = [];
                    tasksByUser[uid].push(task);
                }
                // Send push to each user
                for (const [userId, tasks] of Object.entries(tasksByUser)) {
                    const user = await userRepo.findById(userId);
                    if (user && user.fcmToken && user.pushEnabled !== false) {
                        await notificationService.sendPushNotification(user.fcmToken, {
                            notification: {
                                title: 'Garden Tasks Due! 🌿',
                                body: `You have ${tasks.length} task(s) to complete today.`
                            },
                            data: { type: 'TASK_DUE', route: '/tasks' }
                        });
                        logger_1.logger.info(`Sent push to user ${userId} for ${tasks.length} tasks`);
                    }
                }
            }
            catch (err) {
                logger_1.logger.error('Error in ReminderCron:', err);
            }
        });
    }
}
exports.ReminderCron = ReminderCron;
