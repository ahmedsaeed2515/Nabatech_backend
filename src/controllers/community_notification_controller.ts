import { Request, Response } from 'express';
import { NotificationService } from '../services/notification_service';
import { logger } from '../utils/logger';

export class CommunityNotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id || (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await NotificationService.getNotifications(userId, page, limit);

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Failed to get community notifications', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id || (req as any).userId;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const updated = await NotificationService.markAsRead(userId as string, notificationId as string);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Failed to mark community notification as read', { error });
      res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id || (req as any).userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      await NotificationService.markAllAsRead(userId);

      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
      logger.error('Failed to mark all community notifications as read', { error });
      res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
  }
}
