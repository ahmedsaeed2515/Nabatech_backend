import { Schema, model, Document } from "mongoose";

export interface IAiPromptTemplate extends Document {
  name: string; // e.g., 'system_assistant', 'diagnosis_analyzer'
  systemPrompt: string;
  userPromptTemplate?: string;
  version: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const aiPromptTemplateSchema = new Schema<IAiPromptTemplate>(
  {
    name: { type: String, required: true, unique: true, index: true },
    systemPrompt: { type: String, required: true },
    userPromptTemplate: { type: String },
    version: { type: String, default: "1.0.0" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IAiPromptTemplate>("AiPromptTemplate", aiPromptTemplateSchema);


