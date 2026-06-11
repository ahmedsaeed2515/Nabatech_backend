import mongoose, { Document, Schema } from "mongoose";

export interface IReminder extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  plantName: string;
  timeLabel: string;
  iconCodePoint: number;
  enabled: boolean;
  scheduledAt?: Date;
  timeZone?: string;
  recurrence?: string;
  clientOperationId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    plantName: { type: String, required: true },
    timeLabel: { type: String, required: true }, // Legacy display label
    iconCodePoint: { type: Number, default: 58264 },
    enabled: { type: Boolean, default: true },
    scheduledAt: { type: Date, required: false },
    timeZone: { type: String, required: false },
    recurrence: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], required: false },
    clientOperationId: { type: String, required: false },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, scheduledAt: 1, _id: 1 });
reminderSchema.index(
  { user: 1, clientOperationId: 1 }, 
  { unique: true, partialFilterExpression: { clientOperationId: { $type: "string" } } }
);

export default mongoose.model<IReminder>("Reminder", reminderSchema);
