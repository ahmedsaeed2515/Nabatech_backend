import cron from 'node-cron';
import { TaskRepository } from '../repositories/TaskRepository';
import { UserRepository } from '../repositories/UserRepository';
import { NotificationService } from '../services/NotificationService';
import { TaskStatus } from '../models/task_model';
import { logger } from '../utils/logger';

export class ReminderCron {
  static start() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Running ReminderCron to send push notifications...');
      try {
        const taskRepo = new TaskRepository();
        const userRepo = new UserRepository();
        const notificationService = new NotificationService();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find pending tasks for today
        const pendingTasks = await taskRepo.findPendingForToday(todayStart, todayEnd);

        // Group tasks by user
        const tasksByUser: Record<string, typeof pendingTasks> = {};
        for (const task of pendingTasks) {
          const uid = task.user.toString();
          if (!tasksByUser[uid]) tasksByUser[uid] = [];
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
            logger.info(`Sent push to user ${userId} for ${tasks.length} tasks`);
          }
        }
      } catch (err) {
        logger.error('Error in ReminderCron:', err);
      }
    });
  }
}
