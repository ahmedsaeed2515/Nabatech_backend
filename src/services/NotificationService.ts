const admin = require('firebase-admin');
import { env } from '../config/env';
import { logger } from '../utils/logger';
import NotificationModel, { NotificationType } from '../models/notification_model';

// Initialize Firebase Admin lazily if the project provides credentials
try {
  if (!admin.apps.length) {
    if (env.FIREBASE_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(env.FIREBASE_CREDENTIALS))
      });
    } else {
      // FIX [TASK-0.5]: Warn loudly if FCM is unconfigured
      if (!process.env.FIREBASE_CREDENTIALS) {
        console.warn(
          '\n⚠️  [NotificationService] FIREBASE_CREDENTIALS not set.\n' +
          '   Push notifications are DISABLED until this env var is configured.\n' +
          '   See backend/MISSING_ENV_VARS.md for instructions.\n'
        );
      }
    }
  }
} catch (e) {
  logger.error('Failed to initialize Firebase Admin', e);
}

export class NotificationService {
  /**
   * Send a push notification AND persist it to the database.
   * Works even when FCM is not configured — the DB record will still be created.
   */
  async sendPushNotification(
    fcmToken: string,
    payload: { notification: { title: string; body: string }; data?: Record<string, string> },
    options?: { userId?: string; type?: NotificationType }
  ) {
    // ✅ Always persist to DB for in-app notification center
    if (options?.userId) {
      try {
        await NotificationModel.create({
          user: options.userId,
          title: payload.notification.title,
          body: payload.notification.body,
          type: options.type || 'GENERAL',
          data: payload.data || {},
          read: false
        });
      } catch (dbErr) {
        logger.warn('Failed to persist notification to DB:', dbErr);
      }
    }

    // Send FCM push if Firebase is configured
    if (!admin.apps.length) {
      logger.warn('FCM not configured — notification saved to DB only. Token: ' + fcmToken.substring(0, 20) + '...');
      return;
    }

    try {
      const response = await admin.messaging().send({
        token: fcmToken,
        data: payload.data || {},
        notification: payload.notification
      });
      logger.info(`Successfully sent FCM message: ${response}`);
      return response;
    } catch (error) {
      logger.error('Error sending FCM message:', error);
      // Don't throw — DB record already saved
    }
  }
}

