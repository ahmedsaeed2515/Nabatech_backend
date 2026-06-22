"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityNotificationController = void 0;
const notification_service_1 = require("../services/notification_service");
const logger_1 = require("../utils/logger");
class CommunityNotificationController {
    static async getNotifications(req, res) {
        try {
            const userId = req.user?.id || req.user?._id || req.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const result = await notification_service_1.NotificationService.getNotifications(userId, page, limit);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            logger_1.logger.error('Failed to get community notifications', { error });
            res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
        }
    }
    static async markAsRead(req, res) {
        try {
            const userId = req.user?.id || req.user?._id || req.userId;
            const notificationId = req.params.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const updated = await notification_service_1.NotificationService.markAsRead(userId, notificationId);
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Notification not found' });
            }
            res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark community notification as read', { error });
            res.status(500).json({ success: false, message: 'Failed to update notification' });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user?.id || req.user?._id || req.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            await notification_service_1.NotificationService.markAllAsRead(userId);
            res.status(200).json({ success: true, message: 'All notifications marked as read' });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark all community notifications as read', { error });
            res.status(500).json({ success: false, message: 'Failed to update notifications' });
        }
    }
}
exports.CommunityNotificationController = CommunityNotificationController;
