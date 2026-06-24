"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBroadcastHistory = exports.broadcastNotification = void 0;
const user_model_1 = __importDefault(require("../models/user_model"));
const broadcast_notification_model_1 = __importDefault(require("../models/broadcast_notification_model"));
const notification_model_1 = __importDefault(require("../models/notification_model"));
const NotificationService_1 = require("../services/NotificationService");
const logger_1 = require("../utils/logger");
const notificationService = new NotificationService_1.NotificationService();
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, targetAudience, targetUserId } = req.body;
        const adminId = req.user._id;
        if (!title || !message || !targetAudience) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }
        let userQuery = { pushEnabled: true };
        switch (targetAudience) {
            case 'ALL_USERS':
            case 'ALL':
                // No additional filter
                break;
            case 'ALL_EXPERTS':
            case 'EXPERTS':
                userQuery.role = 'expert';
                break;
            case 'ALL_ADMINS':
                userQuery.role = { $in: ['admin', 'super_admin'] };
                break;
            case 'SELECTED_USERS':
            case 'selected':
                const userIds = req.body.userIds;
                if (!Array.isArray(userIds) || userIds.length === 0) {
                    res.status(400).json({ success: false, message: 'userIds array is required for SELECTED_USERS' });
                    return;
                }
                userQuery._id = { $in: userIds };
                break;
            case 'SPECIFIC_USER':
            case 'SPECIFIC':
                if (!targetUserId) {
                    res.status(400).json({ success: false, message: 'Specific User ID is required' });
                    return;
                }
                userQuery._id = targetUserId;
                break;
            case 'FARMERS':
                userQuery.role = 'user';
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid target audience' });
                return;
        }
        // Exclude users with no FCM token for the push part, but we might still want to create DB notifications.
        // However, for broadcasts, we'll only count the actual target audience size.
        const users = await user_model_1.default.find(userQuery).select('_id fcmToken');
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
            await notification_model_1.default.insertMany(notificationDocs, { ordered: false });
        }
        catch (dbErr) {
            logger_1.logger.warn('Failed to insert bulk notifications:', dbErr);
        }
        // 2. Filter tokens for push
        const tokens = users.map(u => u.fcmToken).filter((token) => typeof token === 'string' && token.trim() !== '');
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
                }
                catch (pushErr) {
                    logger_1.logger.error('Failed to send push batch:', pushErr);
                    failureCount += batch.length;
                }
            }
        }
        // 3. Save Broadcast History
        const broadcastRecord = await broadcast_notification_model_1.default.create({
            title,
            body: message,
            targetAudience,
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
    }
    catch (error) {
        logger_1.logger.error('Error broadcasting notification:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.broadcastNotification = broadcastNotification;
const getBroadcastHistory = async (req, res) => {
    try {
        const history = await broadcast_notification_model_1.default.find()
            .populate('createdBy', 'name email')
            .populate('targetUserId', 'name email')
            .sort({ createdAt: -1 })
            .limit(50); // Get last 50 for admin dashboard
        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching broadcast history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getBroadcastHistory = getBroadcastHistory;
