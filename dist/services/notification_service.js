"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const community_notification_model_1 = __importDefault(require("../models/community_notification_model"));
const logger_1 = require("../utils/logger");
class NotificationService {
    static async sendNotification(data) {
        try {
            // Don't send notification to self, unless it's a system-generated type like BADGE_EARNED
            if (data.userId === data.actorId && !['BADGE_EARNED', 'EXPERT_LEVEL_UP'].includes(data.type)) {
                return;
            }
            // Deduplication: check if an unread notification of the same type/actor/entity already exists
            const existing = await community_notification_model_1.default.findOne({
                userId: new mongoose_1.default.Types.ObjectId(data.userId),
                actorId: new mongoose_1.default.Types.ObjectId(data.actorId),
                type: data.type,
                entityId: new mongoose_1.default.Types.ObjectId(data.entityId),
                read: false
            });
            if (existing) {
                // Just update the timestamp to bump it
                existing.updatedAt = new Date();
                existing.title = data.title;
                existing.message = data.message;
                await existing.save();
                return;
            }
            const notification = new community_notification_model_1.default({
                userId: new mongoose_1.default.Types.ObjectId(data.userId),
                actorId: new mongoose_1.default.Types.ObjectId(data.actorId),
                type: data.type,
                entityId: new mongoose_1.default.Types.ObjectId(data.entityId),
                entityType: data.entityType,
                title: data.title,
                message: data.message,
            });
            await notification.save();
            logger_1.logger.info('Notification created', {
                event: 'community_notification.created',
                userId: data.userId,
                type: data.type,
            });
            // Optional: If we had WebSockets/Socket.io, we would emit the notification here to the connected user.
        }
        catch (error) {
            logger_1.logger.error('Failed to create notification', { error });
        }
    }
    static async getNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            community_notification_model_1.default.find({ userId: new mongoose_1.default.Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actorId', 'name avatarUrl'),
            community_notification_model_1.default.countDocuments({ userId: new mongoose_1.default.Types.ObjectId(userId) })
        ]);
        const unreadCount = await community_notification_model_1.default.countDocuments({ userId: new mongoose_1.default.Types.ObjectId(userId), read: false });
        return {
            items,
            total,
            page,
            pages: Math.ceil(total / limit),
            unreadCount,
        };
    }
    static async markAsRead(userId, notificationId) {
        return community_notification_model_1.default.findOneAndUpdate({ _id: new mongoose_1.default.Types.ObjectId(notificationId), userId: new mongoose_1.default.Types.ObjectId(userId) }, { read: true }, { new: true });
    }
    static async markAllAsRead(userId) {
        return community_notification_model_1.default.updateMany({ userId: new mongoose_1.default.Types.ObjectId(userId), read: false }, { read: true });
    }
}
exports.NotificationService = NotificationService;
