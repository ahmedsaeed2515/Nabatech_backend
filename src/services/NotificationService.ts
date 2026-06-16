const admin = require('firebase-admin');
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Initialize Firebase Admin lazily if the project provides credentials
try {
  if (!admin.apps.length) {
    if (env.FIREBASE_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(env.FIREBASE_CREDENTIALS))
      });
    } else {
      logger.warn('FIREBASE_CREDENTIALS not provided in environment, FCM push notifications are disabled.');
    }
  }
} catch (e) {
  logger.error('Failed to initialize Firebase Admin', e);
}

export class NotificationService {
  async sendPushNotification(fcmToken: string, payload: any) {
    if (!admin.apps.length) {
      logger.warn('Mock sending push to token: ' + fcmToken);
      return;
    }

    try {
      const response = await admin.messaging().send({
        token: fcmToken,
        data: payload.data || {},
        notification: payload.notification
      });
      logger.info(`Successfully sent message: ${response}`);
      return response;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }
}
