import mongoose, { Document, Schema } from "mongoose";

export interface IWateringCalculation extends Document {
  user: mongoose.Types.ObjectId;
  plantType?: string;
  potSize: string;
  season: string;
  location: string;
  days: number;
  volumeMl: number;
  createdAt: Date;
  updatedAt: Date;
}

const wateringCalculationSchema = new Schema<IWateringCalculation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plantType: { type: String, required: false, trim: true },
    potSize: { type: String, required: true, trim: true },
    season: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1 },
    volumeMl: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IWateringCalculation>(
  "WateringCalculation",
  wateringCalculationSchema
);

