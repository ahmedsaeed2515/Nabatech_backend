import mongoose from 'mongoose';
import CommunityNotification from '../models/community_notification_model';
import { logger } from '../utils/logger';

export class NotificationService {
  /**
   * Triggers a new community notification if the actor is not the target user.
   */
  static async sendNotification(data: {
    userId: string;
    actorId: string;
    type: 'LIKE_POST' | 'COMMENT_POST' | 'FOLLOW_USER' | 'REPORT_RESOLVED' | 'BADGE_EARNED' | 'EXPERT_LEVEL_UP';
    entityId: string;
    entityType: 'CommunityPost' | 'CommentV2' | 'User' | 'CommunityReport';
    title: string;
    message: string;
  }): Promise<void> {
    try {
      // Don't send notification to self
      if (data.userId === data.actorId) {
        return;
      }

      const notification = new CommunityNotification({
        userId: new mongoose.Types.ObjectId(data.userId),
        actorId: new mongoose.Types.ObjectId(data.actorId),
        type: data.type,
        entityId: new mongoose.Types.ObjectId(data.entityId),
        entityType: data.entityType,
        title: data.title,
        message: data.message,
      });

      await notification.save();

      logger.info('Notification created', {
        event: 'community_notification.created',
        userId: data.userId,
        type: data.type,
      });

      // Optional: If we had WebSockets/Socket.io, we would emit the notification here to the connected user.
    } catch (error) {
      logger.error('Failed to create notification', { error });
    }
  }

  static async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CommunityNotification.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name avatarUrl'),
      CommunityNotification.countDocuments({ userId: new mongoose.Types.ObjectId(userId) })
    ]);

    const unreadCount = await CommunityNotification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), read: false });

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    return CommunityNotification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(notificationId), userId: new mongoose.Types.ObjectId(userId) },
      { read: true },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string) {
    return CommunityNotification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), read: false },
      { read: true }
    );
  }
}
