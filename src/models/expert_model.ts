import mongoose, { Document, Schema } from "mongoose";

export interface IExpert extends Document {
  name: string;
  specialty: string;
  rating: number;
  sessions: number;
  fee: number;
  online: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const expertSchema = new Schema<IExpert>(
  {
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    rating: { type: Number, default: 5.0 },
    sessions: { type: Number, default: 0 },
    fee: { type: Number, required: true },
    online: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IExpert>("Expert", expertSchema);


