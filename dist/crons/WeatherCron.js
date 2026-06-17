"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../utils/logger");
const ZoneRepository_1 = require("../repositories/ZoneRepository");
const WeatherService_1 = require("../services/WeatherService");
const WeatherAlertRepository_1 = require("../repositories/WeatherAlertRepository");
const NotificationService_1 = require("../services/NotificationService");
const weather_alert_model_1 = require("../models/weather_alert_model");
class WeatherCron {
    static start() {
        // Runs every 2 hours: 0 */2 * * *
        node_cron_1.default.schedule('0 */2 * * *', async () => {
            await WeatherCron.execute();
        });
    }
    static async execute() {
        logger_1.logger.info('Running WeatherCron...');
        const zoneRepo = new ZoneRepository_1.ZoneRepository();
        const weatherService = new WeatherService_1.WeatherService();
        const alertRepo = new WeatherAlertRepository_1.WeatherAlertRepository();
        const notificationService = new NotificationService_1.NotificationService();
        try {
            const outdoorZones = await zoneRepo.findOutdoorZonesWithUsers();
            for (const zone of outdoorZones) {
                const user = zone.user;
                if (user.latitude && user.longitude) {
                    try {
                        const weather = await weatherService.getCurrentWeather(user.latitude, user.longitude);
                        if (weather.temp < 5) {
                            // Check if alert already created recently to avoid spam (e.g. today)
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const hasExisting = await alertRepo.checkRecentAlert(user._id.toString(), zone._id.toString(), weather_alert_model_1.AlertSeverity.CRITICAL, today);
                            if (!hasExisting) {
                                const message = `Freezing Warning! Temperature in your outdoor zone '${zone.name}' is ${weather.temp}°C. Protect your plants.`;
                                await alertRepo.create({
                                    user: user._id,
                                    zone: zone._id,
                                    severity: weather_alert_model_1.AlertSeverity.CRITICAL,
                                    message
                                });
                                if (user.fcmToken) {
                                    await notificationService.sendPushNotification(user.fcmToken, {
                                        notification: { title: '🚨 Freezing Temperature Alert', body: message },
                                        data: { type: 'ALERT_WEATHER' }
                                    });
                                }
                            }
                        }
                    }
                    catch (err) {
                        logger_1.logger.error(`Failed to process weather for user ${user._id}`, err);
                    }
                }
            }
        }
        catch (err) {
            logger_1.logger.error('Error in WeatherCron execution:', err);
        }
    }
}
exports.WeatherCron = WeatherCron;
