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
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IPlant>("Plant", plantSchema);
