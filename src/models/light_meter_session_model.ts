import mongoose, { Document, Schema } from "mongoose";

export interface ILightMeterSession extends Document {
  user: mongoose.Types.ObjectId;
  plantId?: string;
  lux: number;
  zone: string;
  createdAt: Date;
  updatedAt: Date;
}

const lightMeterSessionSchema = new Schema<ILightMeterSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plantId: { type: String, required: false, trim: true },
    lux: { type: Number, required: true, min: 0 },
    zone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILightMeterSession>("LightMeterSession", lightMeterSessionSchema);

