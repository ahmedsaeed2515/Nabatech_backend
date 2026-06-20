import { Schema, model, Document } from "mongoose";

export interface IAiSafetyPolicy extends Document {
  name: string;
  blockToxicity: boolean;
  detectHallucinations: boolean;
  piiRedaction: boolean;
  spamProtection: boolean;
  active: boolean;
}

const aiSafetyPolicySchema = new Schema<IAiSafetyPolicy>({
  name: { type: String, required: true, unique: true },
  blockToxicity: { type: Boolean, default: true },
  detectHallucinations: { type: Boolean, default: true },
  piiRedaction: { type: Boolean, default: false },
  spamProtection: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IAiSafetyPolicy>("AiSafetyPolicy", aiSafetyPolicySchema);
