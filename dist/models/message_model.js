"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: String, enum: ["user", "llm"], required: true }, // Legacy
    text: { type: String, required: true },
    conversationId: { type: String, trim: true },
    role: { type: String, enum: ["user", "assistant", "system"] },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    provider: { type: String, trim: true },
    source: { type: String, trim: true },
    sourceIds: { type: [String], default: [] },
    requestId: { type: String, trim: true },
    clientOperationId: { type: String, trim: true },
    errorCode: { type: String, trim: true },
    // Image chat fields — persists Cloudinary URL and CNN result
    imageUrl: { type: String, trim: true },
    diagnosisResult: {
        type: {
            prediction: { type: String },
            confidence: { type: Number },
            candidates: { type: [{ label: String, confidence: Number }], default: [] },
        },
        default: undefined,
    },
}, { timestamps: true });
messageSchema.index({ user: 1, createdAt: -1, _id: -1 });
messageSchema.index({ user: 1, conversationId: 1, createdAt: 1 });
messageSchema.index({ user: 1, conversationId: 1, createdAt: -1 }); // for history window queries
messageSchema.index({ user: 1, clientOperationId: 1 }, { unique: true, partialFilterExpression: { clientOperationId: { $exists: true, $type: "string" } } });
exports.default = (0, mongoose_1.model)("Message", messageSchema);
