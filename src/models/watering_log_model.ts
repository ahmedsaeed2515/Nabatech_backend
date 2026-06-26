import mongoose, { Document, Schema } from "mongoose";

export interface IWateringLog extends Document {
  plant: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  wateredAt: Date;
  note?: string;
  createdAt: Date;
}

const wateringLogSchema = new Schema<IWateringLog>(
  {
    plant: { type: Schema.Types.ObjectId, ref: "MyPlant", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wateredAt: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IWateringLog>("WateringLog", wateringLogSchema);


