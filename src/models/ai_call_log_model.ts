import mongoose, { Document, Schema } from "mongoose";

export interface IAiCallLog extends Document {
  userId?: string;
  feature: "diagnosis" | "chat" | "image_chat";
  provider: string;
  status: "success" | "failure";
  latencyMs: number;
  inputMeta?: Record<string, unknown>;
  outputMeta?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiCallLogSchema = new Schema<IAiCallLog>(
  {
    userId: { type: String, default: "" },
    feature: { type: String, enum: ["diagnosis", "chat", "image_chat"], required: true },
    provider: { type: String, required: true, trim: true },
    status: { type: String, enum: ["success", "failure"], required: true },
    latencyMs: { type: Number, required: true, min: 0 },
    inputMeta: { type: Schema.Types.Mixed, default: {} },
    outputMeta: { type: Schema.Types.Mixed, default: {} },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IAiCallLog>("AiCallLog", aiCallLogSchema);
