import { Schema, model, Document } from "mongoose";

export interface IAiProvider extends Document {
  name: string; // e.g. openai, anthropic, google
  displayName: string;
  baseUrl: string;
  apiKeyEnc: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const aiProviderSchema = new Schema<IAiProvider>(
  {
    name: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    baseUrl: { type: String, required: true },
    apiKeyEnc: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IAiProvider>("AiProvider", aiProviderSchema);
