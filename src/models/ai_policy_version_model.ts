import { Schema, model, Types, Document } from "mongoose";

export interface IAiPolicyVersion extends Document {
  policyType: string; // "agent", "memory", "tool", etc.
  policyId: Types.ObjectId;
  snapshot: any;
  updatedBy: Types.ObjectId;
  createdAt: Date;
}

const aiPolicyVersionSchema = new Schema<IAiPolicyVersion>({
  policyType: { type: String, required: true },
  policyId: { type: Schema.Types.ObjectId, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model<IAiPolicyVersion>("AiPolicyVersion", aiPolicyVersionSchema);


