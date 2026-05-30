import mongoose, { Document, Schema } from "mongoose";

export interface IDiaryEntry extends Document {
  user: mongoose.Types.ObjectId;
  plantName: string;
  title: string;
  notes: string;
  date: Date;
  moodCode: number;
  healthScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const diaryEntrySchema = new Schema<IDiaryEntry>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plantName: { type: String, required: true },
    title: { type: String, required: true },
    notes: { type: String, required: true },
    date: { type: Date, default: Date.now },
    moodCode: { type: Number, default: 61471 },
    healthScore: { type: Number, min: 0, max: 100, default: 80 },
  },
  { timestamps: true }
);

export default mongoose.model<IDiaryEntry>("DiaryEntry", diaryEntrySchema);
