"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var homeAnalyticsSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    eventType: { type: String, enum: ["view", "click"], required: true },
    entityType: { type: String, enum: ["banner", "widget", "action", "section_item"], required: true },
    entityId: { type: String, required: true },
}, { timestamps: true });
// TTL 90 days
homeAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
exports.default = (0, mongoose_1.model)("HomeAnalytics", homeAnalyticsSchema);
