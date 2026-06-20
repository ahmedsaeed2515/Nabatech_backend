import { Schema, model, Types, Document } from "mongoose";

export interface IAiModel extends Document {
  provider: Types.ObjectId;
  modelId: string; // e.g., gpt-4o, claude-3-haiku
  displayName: string;
  type: "chat" | "vision" | "embedding" | "diagnosis";
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const aiModelSchema = new Schema<IAiModel>(
  {
    provider: { type: Schema.Types.ObjectId, ref: "AiProvider", required: true },
    modelId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    type: { type: String, enum: ["chat", "vision", "embedding", "diagnosis"], required: true },
    contextWindow: { type: Number, default: 8192 },
    inputCostPer1k: { type: Number, default: 0 },
    outputCostPer1k: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IAiModel>("AiModel", aiModelSchema);
