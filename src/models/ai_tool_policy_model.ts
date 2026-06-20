import { Schema, model, Document } from "mongoose";

export interface IAiToolPolicy extends Document {
  name: string;
  allowedTools: string[];
  maxExecutionSteps: number;
  active: boolean;
}

const aiToolPolicySchema = new Schema<IAiToolPolicy>({
  name: { type: String, required: true, unique: true },
  allowedTools: { type: [String], default: [] },
  maxExecutionSteps: { type: Number, default: 5 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IAiToolPolicy>("AiToolPolicy", aiToolPolicySchema);
