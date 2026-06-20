"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    titleAr: { type: String },
    titleEn: { type: String },
    bodyAr: { type: String },
    bodyEn: { type: String },
    type: {
        type: String,
        enum: [
            'EXPERT_REVIEW_COMPLETE', 'WATERING_REMINDER', 'DISEASE_ALERT',
            'COMMUNITY_COMMENT', 'COMMUNITY_LIKE', 'OUTBREAK_ALERT', 'AGENT_ACTION', 'GENERAL'
        ],
        default: 'GENERAL'
    },
    data: { type: mongoose_1.default.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false }
}, { timestamps: true });
// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
exports.default = mongoose_1.default.model('Notification', notificationSchema);
