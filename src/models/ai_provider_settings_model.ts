import mongoose, { Document, Schema } from "mongoose";

export interface IAiProviderSettings extends Document {
  providerName: string; // e.g. openrouter, gemini, openai, huggingface
  enabled: boolean;
  priority: number;
  defaultProvider: boolean;
  apiKeyEncrypted: string;
  llmModel: string;
  baseUrl: string;
  status: "healthy" | "degraded" | "failed" | "unknown";
  lastHealthCheck?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiProviderSettingsSchema = new Schema<IAiProviderSettings>(
  {
    providerName: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    priority: { type: Number, required: true, default: 99 },
    defaultProvider: { type: Boolean, default: false },
    apiKeyEncrypted: { type: String, default: "" },
    llmModel: { type: String, required: true },
    baseUrl: { type: String, required: true },
    status: { type: String, enum: ["healthy", "degraded", "failed", "unknown"], default: "unknown" },
    lastHealthCheck: { type: Date },
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IAiProviderSettings>("AiProviderSettings", aiProviderSettingsSchema);
