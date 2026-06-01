import mongoose, { Document, Schema } from "mongoose";

export interface IArScanSession extends Document {
  user: mongoose.Types.ObjectId;
  mode: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

const arScanSessionSchema = new Schema<IArScanSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IArScanSession>("ArScanSession", arScanSessionSchema);

