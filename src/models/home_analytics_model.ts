import { Schema, model, Types, Document } from "mongoose";

export interface IHomeAnalytics extends Document {
  userId?: Types.ObjectId;
  eventType: "view" | "click";
  entityType: "banner" | "widget" | "action" | "section_item";
  entityId: string;
  createdAt: Date;
}

const homeAnalyticsSchema = new Schema<IHomeAnalytics>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  eventType: { type: String, enum: ["view", "click"], required: true },
  entityType: { type: String, enum: ["banner", "widget", "action", "section_item"], required: true },
  entityId: { type: String, required: true },
}, { timestamps: true });

// TTL 90 days
homeAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default model<IHomeAnalytics>("HomeAnalytics", homeAnalyticsSchema);


