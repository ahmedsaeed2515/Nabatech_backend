import { Request, Response } from 'express';
import User from '../models/user_model';
import BroadcastNotificationModel from '../models/broadcast_notification_model';
import NotificationModel from '../models/notification_model';
import { NotificationService } from '../services/NotificationService';
import { logger } from '../utils/logger';

const notificationService = new NotificationService();

export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message, targetAudience, targetUserId } = req.body;
    const adminId = (req as any).user._id;

    if (!title || !message || !targetAudience) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    let userQuery: any = { pushEnabled: true };
    let dbAudience = 'ALL';

    switch (targetAudience) {
      case 'ALL_USERS':
      case 'ALL':
        dbAudience = 'ALL';
        // No additional filter
        break;
      case 'ALL_EXPERTS':
      case 'EXPERTS':
        dbAudience = 'EXPERTS';
        userQuery.role = 'expert';
        break;
      case 'ALL_ADMINS':
        dbAudience = 'SPECIFIC'; // Saved as specific since it's a filtered subset not in default enums
        userQuery.role = { $in: ['admin', 'super_admin'] };
        break;
      case 'SELECTED_USERS':
      case 'selected':
        dbAudience = 'SPECIFIC';
        const userIds = req.body.userIds;
        if (!Array.isArray(userIds) || userIds.length === 0) {
          res.status(400).json({ success: false, message: 'userIds array is required for SELECTED_USERS' });
          return;
        }
        userQuery._id = { $in: userIds };
        break;
      case 'SPECIFIC_USER':
      case 'SPECIFIC':
        dbAudience = 'SPECIFIC';
        if (!targetUserId) {
          res.status(400).json({ success: false, message: 'Specific User ID is required' });
          return;
        }
        userQuery._id = targetUserId;
        break;
      case 'FARMERS':
        dbAudience = 'FARMERS';
        userQuery.role = 'user';
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid target audience' });
        return;
    }

    // Exclude users with no FCM token for the push part, but we might still want to create DB notifications.
    // However, for broadcasts, we'll only count the actual target audience size.
    const users = await User.find(userQuery).select('_id fcmToken');
    
    if (!users || users.length === 0) {
      res.status(400).json({ success: false, message: 'No users found for this audience (or no users have push enabled)' });
      return;
    }

    // 1. Create DB notifications for in-app center
    const notificationDocs = users.map(u => ({
      user: u._id,
      title: title,
      body: message,
      type: 'GENERAL',
      data: {},
      read: false
    }));

    try {
      await NotificationModel.insertMany(notificationDocs, { ordered: false });
    } catch (dbErr) {
      logger.warn('Failed to insert bulk notifications:', dbErr);
    }

    // 2. Filter tokens for push
    const tokens = users.map(u => u.fcmToken).filter((token): token is string => typeof token === 'string' && token.trim() !== '');

    let successCount = 0;
    let failureCount = 0;

    if (tokens.length > 0) {
      // Chunk tokens in 500 batches
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        try {
          const response = await notificationService.sendMulticast(batch, {
            notification: { title, body: message }
          });
          if (response) {
            successCount += response.successCount;
            failureCount += response.failureCount;
          }
        } catch (pushErr) {
          logger.error('Failed to send push batch:', pushErr);
          failureCount += batch.length;
        }
      }
    }

    // 3. Save Broadcast History
    const broadcastRecord = await BroadcastNotificationModel.create({
      title,
      body: message,
      targetAudience: dbAudience,
      targetUserId,
      totalUsers: users.length,
      successCount,
      failureCount,
      createdBy: adminId
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers: users.length,
        successCount,
        failureCount,
        broadcast: broadcastRecord
      }
    });

  } catch (error: any) {
    logger.error('Error broadcasting notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getBroadcastHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await BroadcastNotificationModel.find()
      .populate('createdBy', 'name email')
      .populate('targetUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // Get last 50 for admin dashboard

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error: any) {
    logger.error('Error fetching broadcast history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


