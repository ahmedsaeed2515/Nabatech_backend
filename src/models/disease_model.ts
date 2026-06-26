import mongoose, { Document, Schema } from "mongoose";

export interface IDisease extends Document {
  nameAr: string;
  nameEn: string;
  imageUrl?: string;
  severity?: "low" | "medium" | "high";
  type?: "Fungal" | "Bacterial" | "Viral" | "Pest";
  affectedPlantsCount: number;
  descriptionAr?: string;
  descriptionEn?: string;
  slug: string;
  normalizedNameEn: string;
  normalizedNameAr: string;
  active: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
}

const diseaseSchema = new Schema<IDisease>(
  {
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    type: { type: String, enum: ["Fungal", "Bacterial", "Viral", "Pest"], default: "Fungal" },
    affectedPlantsCount: { type: Number, default: 0 },
    descriptionAr: { type: String, default: "" },
    descriptionEn: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    normalizedNameEn: { type: String, required: true, index: true },
    normalizedNameAr: { type: String, required: true, index: true },
    active: { type: Boolean, default: true },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes for efficient search
diseaseSchema.index({ type: 1, normalizedNameEn: 1 });

export default mongoose.model<IDisease>("Disease", diseaseSchema);


