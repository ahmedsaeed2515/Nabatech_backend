import mongoose, { Schema, Document } from "mongoose";

export interface IExploreSection extends Document {
  titleEn: string;
  titleAr: string;
  type: 'banner' | 'featured' | 'trending' | 'recommendations' | 'products' | 'experts' | 'outbreaks';
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exploreSectionSchema = new Schema<IExploreSection>(
  {
    titleEn: { type: String, required: true },
    titleAr: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['banner', 'featured', 'trending', 'recommendations', 'products', 'experts', 'outbreaks'],
      unique: true
    },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<IExploreSection>("ExploreSection", exploreSectionSchema);


