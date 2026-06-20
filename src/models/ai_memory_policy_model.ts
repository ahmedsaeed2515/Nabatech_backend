import { Schema, model, Document } from "mongoose";

export interface IAiMemoryPolicy extends Document {
  name: string;
  maxContextTokens: number;
  shortTermTtlDays: number;
  extractLongTermFacts: boolean;
  active: boolean;
}

const aiMemoryPolicySchema = new Schema<IAiMemoryPolicy>({
  name: { type: String, required: true, unique: true },
  maxContextTokens: { type: Number, default: 4096 },
  shortTermTtlDays: { type: Number, default: 7 },
  extractLongTermFacts: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IAiMemoryPolicy>("AiMemoryPolicy", aiMemoryPolicySchema);
