"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var conversationSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, default: "New Conversation" },
    summary: { type: String },
    status: { type: String, enum: ["active", "archived", "escalated"], default: "active" },
    tags: { type: [String], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
conversationSchema.index({ user: 1, lastMessageAt: -1 });
conversationSchema.index({ status: 1 });
exports.default = (0, mongoose_1.model)("Conversation", conversationSchema);
