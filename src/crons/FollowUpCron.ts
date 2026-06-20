// FIX [TASK-7.3]: Send follow-up reminders for past diagnoses
import cron from 'node-cron';
import DiagnosisHistoryModel from '../models/diagnosis_history_model';
import { NotificationService } from '../services/NotificationService';
import { logger } from '../utils/logger';

export const startFollowUpCron = () => {
  cron.schedule('0 9 * * *', async () => { // 9 AM daily
    logger.info('[CRON] Running follow-up reminders...');
    try {
      const overdue = await DiagnosisHistoryModel.find({
        followUpDate: { $lte: new Date() },
        followUpCompleted: { $ne: true }
      }).populate('user', 'fcmToken name').lean();

      const notificationService = new NotificationService();

      for (const diagnosis of overdue) {
        const user = diagnosis.user as any;
        if (!user?.fcmToken) continue;

        await notificationService.sendPushNotification(
          user.fcmToken,
          {
            notification: {
              title: '🌱 Plant Follow-Up',
              body: `How is your plant doing after the ${diagnosis.diseaseNameEn} treatment? Tap to update.`
            },
            data: { diagnosisId: diagnosis._id.toString(), action: 'FOLLOW_UP', type: 'WATERING_REMINDER' }
          },
          { userId: user._id.toString(), type: 'GENERAL' }
        );

        // Mark as sent (not completed) to avoid re-sending
        await DiagnosisHistoryModel.findByIdAndUpdate(diagnosis._id, {
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Reschedule 7 days if no response
        });
      }
      logger.info('[CRON] Follow-up reminders complete.');
    } catch (err) {
      logger.error('[CRON] Follow-up reminders failed:', err);
    }
  });
};
