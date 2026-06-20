import { Schema, model, Types, Document } from "mongoose";

export interface IAiAgentProfile extends Document {
  useCase: string; // diagnosis, community, article, assistant
  displayName: string;
  description: string;
  systemPrompt: Types.ObjectId; // refs AiPromptTemplate
  routingRule: Types.ObjectId; // refs AiRoutingRule
  memoryPolicy: Types.ObjectId;
  toolPolicy: Types.ObjectId;
  escalationPolicy: Types.ObjectId;
  safetyPolicy: Types.ObjectId;
  ragPolicy: Types.ObjectId;
  active: boolean;
}

const aiAgentProfileSchema = new Schema<IAiAgentProfile>({
  useCase: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: { type: String },
  systemPrompt: { type: Schema.Types.ObjectId, ref: "AiPromptTemplate" },
  routingRule: { type: Schema.Types.ObjectId, ref: "AiRoutingRule" },
  memoryPolicy: { type: Schema.Types.ObjectId, ref: "AiMemoryPolicy" },
  toolPolicy: { type: Schema.Types.ObjectId, ref: "AiToolPolicy" },
  escalationPolicy: { type: Schema.Types.ObjectId, ref: "AiEscalationPolicy" },
  safetyPolicy: { type: Schema.Types.ObjectId, ref: "AiSafetyPolicy" },
  ragPolicy: { type: Schema.Types.ObjectId, ref: "AiRagPolicy" },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IAiAgentProfile>("AiAgentProfile", aiAgentProfileSchema);
