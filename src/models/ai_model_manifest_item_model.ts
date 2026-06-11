import mongoose, { Document, Schema } from "mongoose";

export interface IAiModelManifestItem extends Document {
  id: string;
  name: string;
  architecture: string;
  classes: number;
  sizeMb: number;
  inputSize: number;
  normalization: string;
  quantization: string;
  modelUrl: string;
  labelsUrl: string;
  sha256: string;
  recommended: boolean;
  manifestVersion: string;
  platform: string;
  minAppVersion: string;
  active: boolean;
  rollbackOf?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiModelManifestItemSchema = new Schema<IAiModelManifestItem>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    architecture: { type: String, required: true, trim: true },
    classes: { type: Number, required: true, min: 1 },
    sizeMb: { type: Number, required: true, min: 0 },
    inputSize: { type: Number, required: true, default: 224 },
    normalization: { type: String, required: true, default: "zero_to_one", trim: true },
    quantization: { type: String, required: true, trim: true },
    modelUrl: { type: String, required: true, trim: true },
    labelsUrl: { type: String, required: true, trim: true },
    sha256: { type: String, required: true, trim: true },
    recommended: { type: Boolean, default: false },
    manifestVersion: { type: String, default: "1.0", trim: true },
    platform: { type: String, default: "all", trim: true },
    minAppVersion: { type: String, default: "0.0.0", trim: true },
    active: { type: Boolean, default: true },
    rollbackOf: { type: String, trim: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aiModelManifestItemSchema.index(
  { recommended: 1, platform: 1, active: 1 },
  { unique: true, partialFilterExpression: { recommended: true, active: true } }
);

export default mongoose.model<IAiModelManifestItem>(
  "AiModelManifestItem",
  aiModelManifestItemSchema
);
