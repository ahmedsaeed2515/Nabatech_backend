import { Request, Response } from 'express';
import NotificationModel from '../models/notification_model';
import mongoose from 'mongoose';

/**
 * GET /api/notifications
 * Returns paginated notifications for the authenticated user
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      NotificationModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments({ user: userId })
    ]);

    const formattedNotifications = notifications.map((n: any) => {
      let mappedType = 'system';
      const t = (n.type || '').toUpperCase();
      if (t.includes('REMINDER')) mappedType = 'reminder';
      else if (t.includes('ALERT')) mappedType = 'alert';
      else if (t.includes('COMMUNITY')) mappedType = 'community';

      return {
        id: n._id,
        titleAr: n.titleAr || n.title,
        titleEn: n.titleEn || n.title,
        bodyAr: n.bodyAr || n.body,
        bodyEn: n.bodyEn || n.body,
        type: mappedType,
        isRead: n.read,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        data: n.data
      };
    });

    return res.json({
      success: true,
      data: formattedNotifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/notifications/unread-count
 * Returns count of unread notifications for badge display
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const count = await NotificationModel.countDocuments({ user: userId, read: false });
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true, data: notification });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await NotificationModel.updateMany({ user: userId, read: false }, { read: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    await NotificationModel.findOneAndDelete({ _id: req.params.id, user: userId });
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
