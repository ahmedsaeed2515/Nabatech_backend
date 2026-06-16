import mongoose, { Document, Schema } from "mongoose";

export interface IPlant extends Document {
  nameAr: string;
  nameEn: string;
  scientificName?: string;
  imageUrl?: string;
  category?: string;
  careLevel?: "easy" | "medium" | "hard";
  descriptionAr?: string;
  descriptionEn?: string;
  waterRequirements?: string;
  lightRequirements?: string;
  humidityRequirements?: string;
  soilRequirements?: string;
  fertilizerRequirements?: string;
  growthRate?: string;
  matureSize?: string;
  temperatureRange?: string;
  toxicityLevel?: string;
  wateringFrequency?: string;
  careInstructions?: string;
  commonProblems?: string;
  propagationMethod?: string;
  nativeRegion?: string;
  plantBenefits?: string;
  slug: string;
  normalizedNameEn: string;
  normalizedNameAr: string;
  active: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
}

const plantSchema = new Schema<IPlant>(
  {
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    scientificName: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    category: { type: String, default: "" },
    careLevel: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    descriptionAr: { type: String, default: "" },
    descriptionEn: { type: String, default: "" },
    waterRequirements: { type: String, default: "" },
    lightRequirements: { type: String, default: "" },
    humidityRequirements: { type: String, default: "" },
    soilRequirements: { type: String, default: "" },
    fertilizerRequirements: { type: String, default: "" },
    growthRate: { type: String, default: "" },
    matureSize: { type: String, default: "" },
    temperatureRange: { type: String, default: "" },
    toxicityLevel: { type: String, default: "" },
    wateringFrequency: { type: String, default: "" },
    careInstructions: { type: String, default: "" },
    commonProblems: { type: String, default: "" },
    propagationMethod: { type: String, default: "" },
    nativeRegion: { type: String, default: "" },
    plantBenefits: { type: String, default: "" },
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
plantSchema.index({ normalizedNameEn: 1 });
plantSchema.index({ normalizedNameAr: 1 });
plantSchema.index({ category: 1, normalizedNameEn: 1 });

export default mongoose.model<IPlant>("Plant", plantSchema);
