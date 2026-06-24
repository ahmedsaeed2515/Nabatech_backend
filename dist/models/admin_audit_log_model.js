"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const adminAuditLogSchema = new mongoose_1.default.Schema({
    admin: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetUser: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', default: null },
    targetUsers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    details: { type: mongoose_1.default.Schema.Types.Mixed },
}, {
    timestamps: true
});
// Indexes for fast querying by admin or action
adminAuditLogSchema.index({ admin: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetUser: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('AdminAuditLog', adminAuditLogSchema);
