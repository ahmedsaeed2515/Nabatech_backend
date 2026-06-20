import mongoose, { Schema, Document } from "mongoose";

export interface IExplorePlacement extends Document {
  contentType: 'article' | 'product' | 'expert' | 'post' | 'plant';
  contentId: mongoose.Types.ObjectId;
  section: 'banner' | 'featured' | 'trending' | 'recommendations';
  title: string;
  description: string;
  imageUrl: string;
  priority: number;
  targetInterests: string[];
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  abGroup: 'A' | 'B' | 'all';
  createdAt: Date;
  updatedAt: Date;
}

const explorePlacementSchema = new Schema<IExplorePlacement>(
  {
    contentType: {
      type: String,
      required: true,
      enum: ['article', 'product', 'expert', 'post', 'plant'],
      index: true
    },
    contentId: { type: Schema.Types.ObjectId, required: true, index: true },
    section: {
      type: String,
      required: true,
      enum: ['banner', 'featured', 'trending', 'recommendations'],
      index: true
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    priority: { type: Number, default: 0, index: true },
    targetInterests: [{ type: String, index: true }],
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    abGroup: {
      type: String,
      enum: ['A', 'B', 'all'],
      default: 'all',
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<IExplorePlacement>("ExplorePlacement", explorePlacementSchema);
