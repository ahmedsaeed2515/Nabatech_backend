import mongoose from 'mongoose';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import NotificationModel, { NotificationType } from '../models/notification_model';
import User from '../models/user_model';

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
      if (!process.env.FIREBASE_CREDENTIALS) {
        console.warn(
          '\n⚠️  [NotificationService] FIREBASE_CREDENTIALS not set.\n' +
          '   Push notifications are DISABLED until this env var is configured.\n'
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
   */
  async sendPushNotification(
    fcmToken: string,
    payload: { notification: { title: string; body: string; titleAr?: string; titleEn?: string; bodyAr?: string; bodyEn?: string }; data?: Record<string, string> },
    options?: { userId?: string; type?: NotificationType; [key: string]: any }
  ) {
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

    if (!getApps().length || !fcmToken) {
      logger.warn('FCM not configured or token missing — notification saved to DB only.');
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
    }
  }

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
      return response;
    } catch (error) {
      logger.error('Error sending multicast FCM messages:', error);
    }
  }

  /**
   * Unified sendNotification to replace community_notification_service
   */
  static async sendNotification(data: {
    userId: string;
    actorId: string;
    type: NotificationType;
    entityId: string;
    entityType?: string;
    title: string;
    message: string;
    deepLink?: string;
    postId?: string;
    commentId?: string;
    plantId?: string;
    expertId?: string;
    image?: string;
  }): Promise<void> {
    try {
      // Don't send notification to self, unless system generated
      if (data.userId === data.actorId && !['BADGE_EARNED', 'EXPERT_LEVEL_UP', 'AI_DIAGNOSIS'].includes(data.type)) {
        return;
      }

      // Deduplication: check if an unread notification of the same type/actor/entity already exists
      const existing = await NotificationModel.findOne({
        user: new mongoose.Types.ObjectId(data.userId),
        actorId: new mongoose.Types.ObjectId(data.actorId),
        type: data.type,
        entityId: new mongoose.Types.ObjectId(data.entityId),
        read: false
      });

      if (existing) {
        existing.updatedAt = new Date();
        existing.title = data.title;
        existing.body = data.message;
        await existing.save();
        return;
      }

      const receiver = await User.findById(data.userId).select('fcmToken pushEnabled');
      const actor = await User.findById(data.actorId).select('name avatarUrl');

      const notification = new NotificationModel({
        user: new mongoose.Types.ObjectId(data.userId),
        actorId: new mongoose.Types.ObjectId(data.actorId),
        senderName: actor?.name,
        senderImage: actor?.avatarUrl,
        type: data.type,
        entityId: new mongoose.Types.ObjectId(data.entityId),
        entityType: data.entityType,
        postId: data.postId ? new mongoose.Types.ObjectId(data.postId) : undefined,
        commentId: data.commentId ? new mongoose.Types.ObjectId(data.commentId) : undefined,
        plantId: data.plantId ? new mongoose.Types.ObjectId(data.plantId) : undefined,
        expertId: data.expertId ? new mongoose.Types.ObjectId(data.expertId) : undefined,
        title: data.title,
        body: data.message,
        deepLink: data.deepLink,
        image: data.image
      });

      await notification.save();

      logger.info('Notification created', {
        event: 'unified_notification.created',
        userId: data.userId,
        type: data.type,
      });

      // Send push notification if FCM token exists and push is enabled
      if (receiver && receiver.fcmToken && receiver.pushEnabled !== false) {
        if (getApps().length) {
          try {
            await getMessaging().send({
              token: receiver.fcmToken,
              notification: {
                title: data.title,
                body: data.message
              },
              data: {
                type: data.type,
                deepLink: data.deepLink || '',
                entityId: data.entityId || '',
                entityType: data.entityType || '',
                postId: data.postId || '',
                commentId: data.commentId || '',
                plantId: data.plantId || '',
                expertId: data.expertId || ''
              }
            });
          } catch (fcmErr) {
            logger.error('Error sending push notification via unified service:', fcmErr);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to create unified notification', { error });
    }
  }

  static async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      NotificationModel.find({ user: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name avatarUrl'),
      NotificationModel.countDocuments({ user: new mongoose.Types.ObjectId(userId) })
    ]);

    const unreadCount = await NotificationModel.countDocuments({ user: new mongoose.Types.ObjectId(userId), read: false });

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    return NotificationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(notificationId), user: new mongoose.Types.ObjectId(userId) },
      { read: true },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string) {
    return NotificationModel.updateMany(
      { user: new mongoose.Types.ObjectId(userId), read: false },
      { read: true }
    );
  }
}


