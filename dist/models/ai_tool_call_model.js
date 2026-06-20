"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiToolCallSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    messageId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Message" },
    conversationId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Conversation" },
    toolName: { type: String, required: true, index: true },
    arguments: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    result: { type: mongoose_1.Schema.Types.Mixed },
    status: { type: String, enum: ["pending", "success", "failure"], default: "pending" },
    latencyMs: { type: Number, default: 0 },
    errorMessage: { type: String },
}, { timestamps: true });
aiToolCallSchema.index({ toolName: 1, status: 1 });
aiToolCallSchema.index({ createdAt: -1 });
exports.default = (0, mongoose_1.model)("AiToolCall", aiToolCallSchema);
