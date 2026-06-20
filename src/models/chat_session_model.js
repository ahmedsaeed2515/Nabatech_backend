"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var chatSessionSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    totalTokensUsed: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    conversations: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Conversation" }],
}, { timestamps: true });
chatSessionSchema.index({ user: 1, startedAt: -1 });
chatSessionSchema.index({ startedAt: -1 });
exports.default = (0, mongoose_1.model)("ChatSession", chatSessionSchema);
