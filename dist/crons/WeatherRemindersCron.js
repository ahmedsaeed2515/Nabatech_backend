"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWeatherReminders = void 0;
// FIX [TASK-7.4]: Daily weather-triggered plant care reminders
const node_cron_1 = __importDefault(require("node-cron"));
const WeatherService_1 = require("../services/WeatherService");
const user_model_1 = __importDefault(require("../models/user_model"));
const NotificationService_1 = require("../services/NotificationService");
const logger_1 = require("../utils/logger");
const startWeatherReminders = () => {
    node_cron_1.default.schedule('0 7 * * *', async () => {
        logger_1.logger.info('[CRON] Running weather reminders...');
        const users = await user_model_1.default.find({
            fcmToken: { $exists: true, $ne: null },
            'location.lat': { $exists: true }
        }).lean();
        const weatherService = new WeatherService_1.WeatherService();
        const notificationService = new NotificationService_1.NotificationService();
        for (const user of users) {
            try {
                const weather = await weatherService.getCurrentWeather(user.location.lat, user.location.lon);
                let alert = null;
                if (weather.tempC > 35) {
                    alert = {
                        title: '🌡️ High Temperature Alert',
                        body: `It's ${weather.tempC}°C today — water your plants now to prevent heat stress.`
                    };
                }
                else if (weather.willRainToday) {
                    alert = {
                        title: '🌧️ Rain Expected Today',
                        body: 'Rain is expected — skip watering today and let nature do it.'
                    };
                }
                if (alert && user.fcmToken) {
                    await notificationService.sendPushNotification(user.fcmToken, { notification: alert, data: { type: 'WEATHER_ALERT' } }, { userId: user._id.toString(), type: 'GENERAL' });
                }
            }
            catch (err) {
                logger_1.logger.warn(`[WeatherReminder] Failed for user ${user._id}:`, err);
            }
        }
        logger_1.logger.info('[CRON] Weather reminders complete.');
    });
};
exports.startWeatherReminders = startWeatherReminders;
