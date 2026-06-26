"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const NotificationService_1 = require("../services/NotificationService");
const notification_model_1 = __importDefault(require("../models/notification_model"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * GET /api/notifications
 * Returns paginated notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const result = await NotificationService_1.NotificationService.getNotifications(userId, page, limit);
        return res.json({
            success: true,
            data: {
                items: result.items,
                pageInfo: { page: result.page, limit, total: result.total, pages: result.pages },
                unreadCount: result.unreadCount
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getNotifications = getNotifications;
/**
 * GET /api/notifications/unread-count
 * Returns count of unread notifications for badge display
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const count = await notification_model_1.default.countDocuments({ user: userId, read: false });
        return res.json({ success: true, count });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }
        const notification = await NotificationService_1.NotificationService.markAsRead(userId, req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return res.json({ success: true, data: notification });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.markAsRead = markAsRead;
/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        await NotificationService_1.NotificationService.markAllAsRead(userId);
        return res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }
        await notification_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId });
        return res.json({ success: true, message: 'Notification deleted' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteNotification = deleteNotification;
