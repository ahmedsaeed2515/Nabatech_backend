import { Schema, model, Document } from "mongoose";

export interface IHomeBanner extends Document {
  title: string;
  imageUrl: string;
  targetUrl?: string; // deeplink
  isActive: boolean;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  targetZones: string[];
}

const homeBannerSchema = new Schema<IHomeBanner>({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  targetUrl: { type: String },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  targetZones: { type: [String], default: [] }
}, { timestamps: true });

export default model<IHomeBanner>("HomeBanner", homeBannerSchema);
