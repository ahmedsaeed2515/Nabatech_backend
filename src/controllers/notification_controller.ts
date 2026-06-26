import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
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

    const result = await NotificationService.getNotifications(userId, page, limit);

    return res.json({
      success: true,
      data: {
        items: result.items,
        pageInfo: { page: result.page, limit, total: result.total, pages: result.pages },
        unreadCount: result.unreadCount
      }
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

    const notification = await NotificationService.markAsRead(userId, req.params.id as string);

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

    await NotificationService.markAllAsRead(userId);
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


