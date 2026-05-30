import mongoose, { Document, Schema } from "mongoose";

export interface IReminder extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  plantName: string;
  timeLabel: string;
  iconCodePoint: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    plantName: { type: String, required: true },
    timeLabel: { type: String, required: true },
    iconCodePoint: { type: Number, default: 58264 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IReminder>("Reminder", reminderSchema);
