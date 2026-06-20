"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const admin = require('firebase-admin');
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const notification_model_1 = __importDefault(require("../models/notification_model"));
// Initialize Firebase Admin lazily if the project provides credentials
try {
    if (!admin.apps.length) {
        if (env_1.env.FIREBASE_CREDENTIALS) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(env_1.env.FIREBASE_CREDENTIALS))
            });
        }
        else {
            // FIX [TASK-0.5]: Warn loudly if FCM is unconfigured
            if (!process.env.FIREBASE_CREDENTIALS) {
                console.warn('\n⚠️  [NotificationService] FIREBASE_CREDENTIALS not set.\n' +
                    '   Push notifications are DISABLED until this env var is configured.\n' +
                    '   See backend/MISSING_ENV_VARS.md for instructions.\n');
            }
        }
    }
}
catch (e) {
    logger_1.logger.error('Failed to initialize Firebase Admin', e);
}
class NotificationService {
    /**
     * Send a push notification AND persist it to the database.
     * Works even when FCM is not configured — the DB record will still be created.
     */
    async sendPushNotification(fcmToken, payload, options) {
        // ✅ Always persist to DB for in-app notification center
        if (options?.userId) {
            try {
                await notification_model_1.default.create({
                    user: options.userId,
                    title: payload.notification.title,
                    body: payload.notification.body,
                    titleAr: payload.notification.titleAr,
                    titleEn: payload.notification.titleEn,
                    bodyAr: payload.notification.bodyAr,
                    bodyEn: payload.notification.bodyEn,
                    type: options.type || 'GENERAL',
                    data: payload.data || {},
                    read: false
                });
            }
            catch (dbErr) {
                logger_1.logger.warn('Failed to persist notification to DB:', dbErr);
            }
        }
        // Send FCM push if Firebase is configured
        if (!admin.apps.length) {
            logger_1.logger.warn('FCM not configured — notification saved to DB only. Token: ' + fcmToken.substring(0, 20) + '...');
            return;
        }
        try {
            const response = await admin.messaging().send({
                token: fcmToken,
                data: payload.data || {},
                notification: payload.notification
            });
            logger_1.logger.info(`Successfully sent FCM message: ${response}`);
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error sending FCM message:', error);
            // Don't throw — DB record already saved
        }
    }
}
exports.NotificationService = NotificationService;
