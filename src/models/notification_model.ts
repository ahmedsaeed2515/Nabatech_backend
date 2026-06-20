import mongoose, { Document, Types } from 'mongoose';

export type NotificationType =
  | 'EXPERT_REVIEW_COMPLETE'
  | 'WATERING_REMINDER'
  | 'DISEASE_ALERT'
  | 'COMMUNITY_COMMENT'
  | 'COMMUNITY_LIKE'
  | 'OUTBREAK_ALERT'
  | 'AGENT_ACTION'
  | 'GENERAL';

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  body: string;
  titleAr?: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
  type: NotificationType;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    titleAr: { type: String },
    titleEn: { type: String },
    bodyAr: { type: String },
    bodyEn: { type: String },
    type: {
      type: String,
      enum: [
        'EXPERT_REVIEW_COMPLETE', 'WATERING_REMINDER', 'DISEASE_ALERT',
        'COMMUNITY_COMMENT', 'COMMUNITY_LIKE', 'OUTBREAK_ALERT', 'AGENT_ACTION', 'GENERAL'
      ],
      default: 'GENERAL'
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model<INotification>('Notification', notificationSchema);
