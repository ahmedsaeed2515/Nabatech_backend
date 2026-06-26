import { Schema, model, Document } from "mongoose";

export interface IAiRagPolicy extends Document {
  name: string;
  enabled: boolean;
  topK: number;
  similarityThreshold: number;
  active: boolean;
}

const aiRagPolicySchema = new Schema<IAiRagPolicy>({
  name: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  topK: { type: Number, default: 5 },
  similarityThreshold: { type: Number, default: 0.7 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IAiRagPolicy>("AiRagPolicy", aiRagPolicySchema);


