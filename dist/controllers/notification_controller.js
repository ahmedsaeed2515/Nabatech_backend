"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
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
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            notification_model_1.default.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            notification_model_1.default.countDocuments({ user: userId })
        ]);
        return res.json({
            success: true,
            data: notifications,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
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
        const notification = await notification_model_1.default.findOneAndUpdate({ _id: req.params.id, user: userId }, { read: true }, { new: true });
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
        await notification_model_1.default.updateMany({ user: userId, read: false }, { read: true });
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
