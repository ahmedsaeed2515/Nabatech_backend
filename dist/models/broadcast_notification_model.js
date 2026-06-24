"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const broadcastNotificationSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetAudience: {
        type: String,
        enum: ['ALL', 'FARMERS', 'EXPERTS', 'SPECIFIC'],
        required: true
    },
    targetUserId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    totalUsers: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
exports.default = mongoose_1.default.model('BroadcastNotification', broadcastNotificationSchema);
