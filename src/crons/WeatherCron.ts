import cron from 'node-cron';
import { logger } from '../utils/logger';
import { ZoneRepository } from '../repositories/ZoneRepository';
import { WeatherService } from '../services/WeatherService';
import { WeatherAlertRepository } from '../repositories/WeatherAlertRepository';
import { NotificationService } from '../services/NotificationService';
import { AlertSeverity } from '../models/weather_alert_model';
import { User } from '../models/user_model';

export class WeatherCron {
  static start() {
    // Runs every 2 hours: 0 */2 * * *
    cron.schedule('0 */2 * * *', async () => {
      await WeatherCron.execute();
    });
  }

  static async execute() {
    logger.info('Running WeatherCron...');
      
      const zoneRepo = new ZoneRepository();
      const weatherService = new WeatherService();
      const alertRepo = new WeatherAlertRepository();
      const notificationService = new NotificationService();

      try {
        const outdoorZones = await zoneRepo.findOutdoorZonesWithUsers();

        for (const zone of outdoorZones) {
          const user = zone.user as any as User;
          
          if (user.latitude && user.longitude) {
            try {
              const weather = await weatherService.getCurrentWeather(user.latitude, user.longitude);
              
              if (weather.temp < 5) {
                // Check if alert already created recently to avoid spam (e.g. today)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const hasExisting = await alertRepo.checkRecentAlert(
                  user._id.toString(),
                  zone._id.toString(),
                  AlertSeverity.CRITICAL,
                  today
                );

                if (!hasExisting) {
                  const message = `Freezing Warning! Temperature in your outdoor zone '${zone.name}' is ${weather.temp}°C. Protect your plants.`;
                  
                  await alertRepo.create({
                    user: user._id as any,
                    zone: zone._id as any,
                    severity: AlertSeverity.CRITICAL,
                    message
                  });

                  if (user.fcmToken) {
                    await notificationService.sendPushNotification(
                      user.fcmToken,
                      {
                        notification: { title: '🚨 Freezing Temperature Alert', body: message },
                        data: { type: 'ALERT_WEATHER' }
                      }
                    );
                  }
                }
              }
            } catch (err) {
              logger.error(`Failed to process weather for user ${user._id}`, err);
            }
          }
        }
      } catch (err) {
        logger.error('Error in WeatherCron execution:', err);
      }
  }
}


