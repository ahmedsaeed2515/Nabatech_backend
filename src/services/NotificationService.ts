import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import NotificationModel, { NotificationType } from '../models/notification_model';

// Initialize Firebase Admin lazily if the project provides credentials
try {
  if (!getApps().length) {
    if (env.FIREBASE_CREDENTIALS) {
      let creds;
      try {
        creds = JSON.parse(env.FIREBASE_CREDENTIALS);
      } catch (parseErr) {
        throw new Error("FIREBASE_CREDENTIALS is not valid JSON.");
      }
      initializeApp({
        credential: cert(creds)
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
} catch (e: any) {
  logger.error('Failed to initialize Firebase Admin: ' + e.message);
}

export class NotificationService {
  /**
   * Send a push notification AND persist it to the database.
   * Works even when FCM is not configured — the DB record will still be created.
   */
  async sendPushNotification(
    fcmToken: string,
    payload: { notification: { title: string; body: string; titleAr?: string; titleEn?: string; bodyAr?: string; bodyEn?: string }; data?: Record<string, string> },
    options?: { userId?: string; type?: NotificationType }
  ) {
    // ✅ Always persist to DB for in-app notification center
    if (options?.userId) {
      try {
        await NotificationModel.create({
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
      } catch (dbErr) {
        logger.warn('Failed to persist notification to DB:', dbErr);
      }
    }

    // Send FCM push if Firebase is configured
    if (!getApps().length) {
      logger.warn('FCM not configured — notification saved to DB only. Token: ' + fcmToken.substring(0, 20) + '...');
      return;
    }

    try {
      const response = await getMessaging().send({
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

  /**
   * Send multicast notification to multiple devices.
   */
  async sendMulticast(
    fcmTokens: string[],
    payload: { notification: { title: string; body: string; titleAr?: string; titleEn?: string; bodyAr?: string; bodyEn?: string }; data?: Record<string, string> }
  ) {
    if (!fcmTokens || fcmTokens.length === 0) return;

    if (!getApps().length) {
      logger.warn('FCM not configured — multicast skipped.');
      return;
    }

    try {
      const response = await getMessaging().sendEachForMulticast({
        tokens: fcmTokens,
        data: payload.data || {},
        notification: payload.notification
      });
      logger.info(`Successfully sent multicast FCM messages. Success count: ${response.successCount}, Failure count: ${response.failureCount}`);
      return response;
    } catch (error) {
      logger.error('Error sending multicast FCM messages:', error);
    }
  }
}
