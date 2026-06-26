import { Schema, model, Types, Document } from "mongoose";

export interface IAiToolCall extends Document {
  user?: Types.ObjectId;
  messageId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  toolName: string;
  arguments: Record<string, unknown>;
  result?: Record<string, unknown> | string;
  status: "pending" | "success" | "failure";
  latencyMs: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiToolCallSchema = new Schema<IAiToolCall>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    toolName: { type: String, required: true, index: true },
    arguments: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["pending", "success", "failure"], default: "pending" },
    latencyMs: { type: Number, default: 0 },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

aiToolCallSchema.index({ toolName: 1, status: 1 });
aiToolCallSchema.index({ createdAt: -1 });

export default model<IAiToolCall>("AiToolCall", aiToolCallSchema);


