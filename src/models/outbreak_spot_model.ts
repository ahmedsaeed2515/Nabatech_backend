import mongoose, { Document, Schema } from "mongoose";

export interface IOutbreakSpot extends Document {
  region: string;
  disease: string;
  severity: string;
  cases: number;
  trendPercent: number;
  mapX: number;
  mapY: number;
  colorHex: string;
  createdAt: Date;
  updatedAt: Date;
}

const outbreakSpotSchema = new Schema<IOutbreakSpot>(
  {
    region: { type: String, required: true },
    disease: { type: String, required: true },
    severity: { type: String, enum: ['high', 'medium', 'low', 'حرجة', 'متوسطة', 'منخفضة'], required: true },
    cases: { type: Number, default: 0 },
    trendPercent: { type: Number, default: 0 },
    mapX: { type: Number, required: true },
    mapY: { type: Number, required: true },
    colorHex: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IOutbreakSpot>("OutbreakSpot", outbreakSpotSchema);
