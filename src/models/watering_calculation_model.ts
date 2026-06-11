import mongoose, { Document, Schema } from "mongoose";

export interface IWateringCalculation extends Document {
  user: mongoose.Types.ObjectId;
  plantType?: string;
  plantLibraryId?: mongoose.Types.ObjectId;
  potSize: string;
  season: string;
  location: string;
  days: number;
  volumeMl: number;
  clientOperationId?: string;
  source: 'local' | 'server';
  createdAt: Date;
  updatedAt: Date;
}

const wateringCalculationSchema = new Schema<IWateringCalculation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plantType: { type: String, required: false, trim: true },
    plantLibraryId: { type: Schema.Types.ObjectId, ref: "Plant", required: false },
    potSize: { type: String, required: true, trim: true },
    season: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1 },
    volumeMl: { type: Number, required: true, min: 0 },
    clientOperationId: { type: String, required: false },
    source: { type: String, enum: ['local', 'server'], default: 'local', required: true }
  },
  { timestamps: true }
);

wateringCalculationSchema.index({ user: 1, createdAt: -1, _id: -1 });
wateringCalculationSchema.index({ user: 1, clientOperationId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IWateringCalculation>(
  "WateringCalculation",
  wateringCalculationSchema
);
