import mongoose, { Document, Schema } from "mongoose";

export interface IAiCallLog extends Document {
  userId?: string;
  requestId?: string;
  feature: "diagnosis" | "chat" | "image_chat";
  provider: string;
  modelId?: string;
  sourceIds?: string[];
  status: "success" | "failure";
  latencyMs: number;
  cost?: number;
  tokensUsed?: number;
  routedFrom?: string[];
  inputMeta?: Record<string, unknown>;
  outputMeta?: Record<string, unknown>;
  errorMessage?: string;
  toolCalls?: Array<{
    toolName: string;
    argsSummary: string;
    status: "success" | "failure";
    errorMessage?: string;
    durationMs: number;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const aiCallLogSchema = new Schema<IAiCallLog>(
  {
    userId: { type: String, default: "" },
    requestId: { type: String, trim: true },
    feature: { type: String, enum: ["diagnosis", "chat", "image_chat"], required: true },
    provider: { type: String, required: true, trim: true },
    modelId: { type: String, trim: true },
    sourceIds: { type: [String], default: [] },
    status: { type: String, enum: ["success", "failure"], required: true },
    latencyMs: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    routedFrom: { type: [String], default: [] },
    inputMeta: { type: Schema.Types.Mixed, default: {} },
    outputMeta: { type: Schema.Types.Mixed, default: {} },
    errorMessage: { type: String, default: "" },
    toolCalls: [
      {
        toolName: { type: String, required: true },
        argsSummary: { type: String, required: true },
        status: { type: String, enum: ["success", "failure"], required: true },
        errorMessage: { type: String },
        durationMs: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// TTL index for logs retention (e.g., 30 days)
aiCallLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model<IAiCallLog>("AiCallLog", aiCallLogSchema);

