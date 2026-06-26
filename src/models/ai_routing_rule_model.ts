import { Schema, model, Types, Document } from "mongoose";

export interface IAiRoutingRule extends Document {
  useCase: string; // e.g., 'assistant', 'diagnosis', 'community_moderation'
  primaryModel: Types.ObjectId;
  fallbackModels: Types.ObjectId[];
  abTestActive: boolean;
  abTestModel?: Types.ObjectId;
  abTestSplit?: number; // 0-100% routing to abTestModel
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const aiRoutingRuleSchema = new Schema<IAiRoutingRule>(
  {
    useCase: { type: String, required: true, unique: true, index: true },
    primaryModel: { type: Schema.Types.ObjectId, ref: "AiModel", required: true },
    fallbackModels: [{ type: Schema.Types.ObjectId, ref: "AiModel" }],
    abTestActive: { type: Boolean, default: false },
    abTestModel: { type: Schema.Types.ObjectId, ref: "AiModel" },
    abTestSplit: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IAiRoutingRule>("AiRoutingRule", aiRoutingRuleSchema);


