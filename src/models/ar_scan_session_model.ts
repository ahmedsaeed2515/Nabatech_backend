import mongoose, { Document, Schema } from "mongoose";

export interface IArScanSession extends Document {
  user: mongoose.Types.ObjectId;
  mode: string;
  label: string;
  clientOperationId?: string;
  deviceModel?: string;
  appVersion?: string;
  modelId?: string;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const arScanSessionSchema = new Schema<IArScanSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    clientOperationId: { type: String, trim: true, sparse: true },
    deviceModel: { type: String, trim: true },
    appVersion: { type: String, trim: true },
    modelId: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { timestamps: true }
);

// Indexes for pagination and idempotency
arScanSessionSchema.index({ user: 1, createdAt: -1, _id: -1 });
arScanSessionSchema.index({ user: 1, clientOperationId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IArScanSession>("ArScanSession", arScanSessionSchema);

