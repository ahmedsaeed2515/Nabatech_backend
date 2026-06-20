import { Schema, model, Document } from "mongoose";

export interface IAiEscalationPolicy extends Document {
  name: string;
  confidenceThreshold: number;
  lowConfidenceAction: "warn" | "ask_for_new_image" | "block" | "route_to_human";
  autoEscalateToExpert: boolean;
  active: boolean;
}

const aiEscalationPolicySchema = new Schema<IAiEscalationPolicy>({
  name: { type: String, required: true, unique: true },
  confidenceThreshold: { type: Number, default: 0.5 },
  lowConfidenceAction: { type: String, enum: ["warn", "ask_for_new_image", "block", "route_to_human"], default: "warn" },
  autoEscalateToExpert: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IAiEscalationPolicy>("AiEscalationPolicy", aiEscalationPolicySchema);
