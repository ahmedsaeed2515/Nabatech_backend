"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String },
    senderImage: { type: String },
    title: { type: String, required: true },
    body: { type: String, required: true },
    titleAr: { type: String },
    titleEn: { type: String },
    bodyAr: { type: String },
    bodyEn: { type: String },
    type: {
        type: String,
        enum: [
            'LIKE', 'COMMENT', 'REPLY', 'MENTION', 'FOLLOW', 'EXPERT_REPLY', 'AI_DIAGNOSIS', 'REMINDER', 'GARDEN_ALERT',
            'GENERAL', 'OUTBREAK_ALERT', 'AGENT_ACTION', 'EXPERT_REVIEW_COMPLETE', 'WATERING_REMINDER', 'DISEASE_ALERT',
            'COMMUNITY_COMMENT', 'COMMUNITY_LIKE', 'LIKE_POST', 'COMMENT_POST', 'REPLY_COMMENT', 'FOLLOW_USER',
            'NEW_POST_FROM_FOLLOWING', 'REPORT_RESOLVED', 'BADGE_EARNED', 'EXPERT_LEVEL_UP', 'CONSULTATION_REQUEST',
            'CONSULTATION_ACCEPTED', 'CONSULTATION_REJECTED'
        ],
        default: 'GENERAL'
    },
    postId: { type: mongoose_1.default.Schema.Types.ObjectId },
    commentId: { type: mongoose_1.default.Schema.Types.ObjectId },
    plantId: { type: mongoose_1.default.Schema.Types.ObjectId },
    expertId: { type: mongoose_1.default.Schema.Types.ObjectId },
    entityId: { type: mongoose_1.default.Schema.Types.ObjectId },
    entityType: { type: String },
    image: { type: String },
    deepLink: { type: String },
    data: { type: mongoose_1.default.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false }
}, { timestamps: true });
// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
// Fast query for unread
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('Notification', notificationSchema);
