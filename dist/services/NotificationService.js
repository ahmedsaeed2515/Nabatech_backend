"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const notification_model_1 = __importDefault(require("../models/notification_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
// Initialize Firebase Admin lazily if the project provides credentials
try {
    if (!(0, app_1.getApps)().length) {
        if (env_1.env.FIREBASE_CREDENTIALS) {
            let creds;
            try {
                creds = JSON.parse(env_1.env.FIREBASE_CREDENTIALS);
            }
            catch (parseErr) {
                throw new Error("FIREBASE_CREDENTIALS is not valid JSON.");
            }
            (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(creds)
            });
        }
        else {
            if (!process.env.FIREBASE_CREDENTIALS) {
                console.warn('\n⚠️  [NotificationService] FIREBASE_CREDENTIALS not set.\n' +
                    '   Push notifications are DISABLED until this env var is configured.\n');
            }
        }
    }
}
catch (e) {
    logger_1.logger.error('Failed to initialize Firebase Admin: ' + e.message);
}
class NotificationService {
    /**
     * Send a push notification AND persist it to the database.
     */
    async sendPushNotification(fcmToken, payload, options) {
        if (options?.userId) {
            try {
                await notification_model_1.default.create({
                    user: options.userId,
                    title: payload.notification.title,
                    body: payload.notification.body,
                    titleAr: payload.notification.titleAr,
                    titleEn: payload.notification.titleEn,
                    bodyAr: payload.notification.bodyAr,
                    bodyEn: payload.notification.bodyEn,
                    type: options.type || 'GENERAL',
                    data: payload.data || {},
                    read: false
                });
            }
            catch (dbErr) {
                logger_1.logger.warn('Failed to persist notification to DB:', dbErr);
            }
        }
        if (!(0, app_1.getApps)().length || !fcmToken) {
            logger_1.logger.warn('FCM not configured or token missing — notification saved to DB only.');
            return;
        }
        try {
            const response = await (0, messaging_1.getMessaging)().send({
                token: fcmToken,
                data: payload.data || {},
                notification: payload.notification
            });
            logger_1.logger.info(`Successfully sent FCM message: ${response}`);
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error sending FCM message:', error);
        }
    }
    async sendMulticast(fcmTokens, payload) {
        if (!fcmTokens || fcmTokens.length === 0)
            return;
        if (!(0, app_1.getApps)().length) {
            logger_1.logger.warn('FCM not configured — multicast skipped.');
            return;
        }
        try {
            const response = await (0, messaging_1.getMessaging)().sendEachForMulticast({
                tokens: fcmTokens,
                data: payload.data || {},
                notification: payload.notification
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error sending multicast FCM messages:', error);
        }
    }
    /**
     * Unified sendNotification to replace community_notification_service
     */
    static async sendNotification(data) {
        try {
            // Don't send notification to self, unless system generated
            if (data.userId === data.actorId && !['BADGE_EARNED', 'EXPERT_LEVEL_UP', 'AI_DIAGNOSIS'].includes(data.type)) {
                return;
            }
            // Deduplication: check if an unread notification of the same type/actor/entity already exists
            const existing = await notification_model_1.default.findOne({
                user: new mongoose_1.default.Types.ObjectId(data.userId),
                actorId: new mongoose_1.default.Types.ObjectId(data.actorId),
                type: data.type,
                entityId: new mongoose_1.default.Types.ObjectId(data.entityId),
                read: false
            });
            if (existing) {
                existing.updatedAt = new Date();
                existing.title = data.title;
                existing.body = data.message;
                await existing.save();
                return;
            }
            const receiver = await user_model_1.default.findById(data.userId).select('fcmToken pushEnabled');
            const actor = await user_model_1.default.findById(data.actorId).select('name avatarUrl');
            const notification = new notification_model_1.default({
                user: new mongoose_1.default.Types.ObjectId(data.userId),
                actorId: new mongoose_1.default.Types.ObjectId(data.actorId),
                senderName: actor?.name,
                senderImage: actor?.avatarUrl,
                type: data.type,
                entityId: new mongoose_1.default.Types.ObjectId(data.entityId),
                entityType: data.entityType,
                postId: data.postId ? new mongoose_1.default.Types.ObjectId(data.postId) : undefined,
                commentId: data.commentId ? new mongoose_1.default.Types.ObjectId(data.commentId) : undefined,
                plantId: data.plantId ? new mongoose_1.default.Types.ObjectId(data.plantId) : undefined,
                expertId: data.expertId ? new mongoose_1.default.Types.ObjectId(data.expertId) : undefined,
                title: data.title,
                body: data.message,
                deepLink: data.deepLink,
                image: data.image
            });
            await notification.save();
            logger_1.logger.info('Notification created', {
                event: 'unified_notification.created',
                userId: data.userId,
                type: data.type,
            });
            // Send push notification if FCM token exists and push is enabled
            if (receiver && receiver.fcmToken && receiver.pushEnabled !== false) {
                if ((0, app_1.getApps)().length) {
                    try {
                        await (0, messaging_1.getMessaging)().send({
                            token: receiver.fcmToken,
                            notification: {
                                title: data.title,
                                body: data.message
                            },
                            data: {
                                type: data.type,
                                deepLink: data.deepLink || '',
                                entityId: data.entityId || '',
                                entityType: data.entityType || '',
                                postId: data.postId || '',
                                commentId: data.commentId || '',
                                plantId: data.plantId || '',
                                expertId: data.expertId || ''
                            }
                        });
                    }
                    catch (fcmErr) {
                        logger_1.logger.error('Error sending push notification via unified service:', fcmErr);
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to create unified notification', { error });
        }
    }
    static async getNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            notification_model_1.default.find({ user: new mongoose_1.default.Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actorId', 'name avatarUrl'),
            notification_model_1.default.countDocuments({ user: new mongoose_1.default.Types.ObjectId(userId) })
        ]);
        const unreadCount = await notification_model_1.default.countDocuments({ user: new mongoose_1.default.Types.ObjectId(userId), read: false });
        return {
            items,
            total,
            page,
            pages: Math.ceil(total / limit),
            unreadCount,
        };
    }
    static async markAsRead(userId, notificationId) {
        return notification_model_1.default.findOneAndUpdate({ _id: new mongoose_1.default.Types.ObjectId(notificationId), user: new mongoose_1.default.Types.ObjectId(userId) }, { read: true }, { new: true });
    }
    static async markAllAsRead(userId) {
        return notification_model_1.default.updateMany({ user: new mongoose_1.default.Types.ObjectId(userId), read: false }, { read: true });
    }
}
exports.NotificationService = NotificationService;
