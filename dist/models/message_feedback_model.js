"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageFeedbackSchema = new mongoose_1.Schema({
    message: { type: mongoose_1.Schema.Types.ObjectId, ref: "Message", required: true, unique: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: String, enum: ["upvote", "downvote"], required: true },
    textFeedback: { type: String },
    isHallucination: { type: Boolean, default: false },
    category: { type: String },
}, { timestamps: true });
messageFeedbackSchema.index({ user: 1, createdAt: -1 });
messageFeedbackSchema.index({ isHallucination: 1 });
messageFeedbackSchema.index({ rating: 1 });
exports.default = (0, mongoose_1.model)("MessageFeedback", messageFeedbackSchema);
