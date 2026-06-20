// FIX [TASK-7.4]: Daily weather-triggered plant care reminders
import cron from 'node-cron';
import { WeatherService } from '../services/WeatherService';
import UserModel from '../models/user_model';
import { NotificationService } from '../services/NotificationService';
import { logger } from '../utils/logger';

export const startWeatherReminders = () => {
  cron.schedule('0 7 * * *', async () => { // 7 AM daily
    logger.info('[CRON] Running weather reminders...');
    const users = await UserModel.find({
      fcmToken: { $exists: true, $ne: null },
      'location.lat': { $exists: true }
    }).lean();

    const weatherService = new WeatherService();
    const notificationService = new NotificationService();

    for (const user of users) {
      try {
        const weather = await weatherService.getCurrentWeather(
          (user as any).location.lat,
          (user as any).location.lon
        );

        let alert: { title: string; body: string } | null = null;

        if (weather.tempC > 35) {
          alert = {
            title: '🌡️ High Temperature Alert',
            body: `It's ${weather.tempC}°C today — water your plants now to prevent heat stress.`
          };
        } else if (weather.willRainToday) {
          alert = {
            title: '🌧️ Rain Expected Today',
            body: 'Rain is expected — skip watering today and let nature do it.'
          };
        }

        if (alert && (user as any).fcmToken) {
          await notificationService.sendPushNotification(
            (user as any).fcmToken,
            { notification: alert, data: { type: 'WEATHER_ALERT' } },
            { userId: (user as any)._id.toString(), type: 'GENERAL' }
          );
        }
      } catch (err) {
        logger.warn(`[WeatherReminder] Failed for user ${(user as any)._id}:`, err);
      }
    }
    logger.info('[CRON] Weather reminders complete.');
  });
};
