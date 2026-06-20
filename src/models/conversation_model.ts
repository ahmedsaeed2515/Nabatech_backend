import { Schema, model, Types, Document } from "mongoose";

export interface IConversation extends Document {
  user: Types.ObjectId;
  title: string;
  summary?: string;
  status: "active" | "archived" | "escalated";
  tags: string[];
  lastMessageAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, default: "New Conversation" },
    summary: { type: String },
    status: { type: String, enum: ["active", "archived", "escalated"], default: "active" },
    tags: { type: [String], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, lastMessageAt: -1 });
conversationSchema.index({ status: 1 });

export default model<IConversation>("Conversation", conversationSchema);
