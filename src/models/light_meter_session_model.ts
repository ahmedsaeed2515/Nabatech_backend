import mongoose, { Document, Schema } from "mongoose";

export interface ILightMeterSession extends Document {
  user: mongoose.Types.ObjectId;
  plantId?: string;
  plantLibraryId?: mongoose.Types.ObjectId;
  lux: number;
  zone: string;
  clientOperationId?: string;
  source: 'local' | 'server';
  createdAt: Date;
  updatedAt: Date;
}

const lightMeterSessionSchema = new Schema<ILightMeterSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plantId: { type: String, required: false, trim: true },
    plantLibraryId: { type: Schema.Types.ObjectId, ref: "Plant", required: false },
    lux: { type: Number, required: true, min: 0 },
    zone: { type: String, required: true, trim: true },
    clientOperationId: { type: String, required: false },
    source: { type: String, enum: ['local', 'server'], default: 'local', required: true }
  },
  { timestamps: true }
);

lightMeterSessionSchema.index({ user: 1, createdAt: -1, _id: -1 });
lightMeterSessionSchema.index({ user: 1, clientOperationId: 1 }, { unique: true, sparse: true });

export default mongoose.model<ILightMeterSession>("LightMeterSession", lightMeterSessionSchema);
