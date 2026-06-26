import mongoose, { Document, Types } from 'mongoose';

export type BroadcastAudience = 'ALL' | 'FARMERS' | 'EXPERTS' | 'SPECIFIC';

export interface IBroadcastNotification extends Document {
  title: string;
  body: string;
  targetAudience: BroadcastAudience;
  targetUserId?: Types.ObjectId;
  totalUsers: number;
  successCount: number;
  failureCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const broadcastNotificationSchema = new mongoose.Schema<IBroadcastNotification>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetAudience: {
      type: String,
      enum: ['ALL', 'FARMERS', 'EXPERTS', 'SPECIFIC'],
      required: true
    },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalUsers: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IBroadcastNotification>('BroadcastNotification', broadcastNotificationSchema);


