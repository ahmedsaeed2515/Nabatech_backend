import { Schema, model, Types, Document } from "mongoose";

export interface IChatSession extends Document {
  user?: Types.ObjectId;
  deviceInfo?: string;
  ipAddress?: string;
  startedAt: Date;
  endedAt?: Date;
  totalTokensUsed: number;
  messageCount: number;
  conversations: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    totalTokensUsed: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    conversations: [{ type: Schema.Types.ObjectId, ref: "Conversation" }],
  },
  { timestamps: true }
);

chatSessionSchema.index({ user: 1, startedAt: -1 });
chatSessionSchema.index({ startedAt: -1 });

export default model<IChatSession>("ChatSession", chatSessionSchema);
