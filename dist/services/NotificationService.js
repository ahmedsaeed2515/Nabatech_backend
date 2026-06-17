"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const admin = require('firebase-admin');
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// Initialize Firebase Admin lazily if the project provides credentials
try {
    if (!admin.apps.length) {
        if (env_1.env.FIREBASE_CREDENTIALS) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(env_1.env.FIREBASE_CREDENTIALS))
            });
        }
        else {
            logger_1.logger.warn('FIREBASE_CREDENTIALS not provided in environment, FCM push notifications are disabled.');
        }
    }
}
catch (e) {
    logger_1.logger.error('Failed to initialize Firebase Admin', e);
}
class NotificationService {
    async sendPushNotification(fcmToken, payload) {
        if (!admin.apps.length) {
            logger_1.logger.warn('Mock sending push to token: ' + fcmToken);
            return;
        }
        try {
            const response = await admin.messaging().send({
                token: fcmToken,
                data: payload.data || {},
                notification: payload.notification
            });
            logger_1.logger.info(`Successfully sent message: ${response}`);
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error sending message:', error);
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
