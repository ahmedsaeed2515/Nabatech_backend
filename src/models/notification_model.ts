import mongoose, { Document, Types } from 'mongoose';

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'REPLY'
  | 'MENTION'
  | 'FOLLOW'
  | 'EXPERT_REPLY'
  | 'AI_DIAGNOSIS'
  | 'REMINDER'
  | 'GARDEN_ALERT'
  | 'GENERAL'
  | 'OUTBREAK_ALERT'
  | 'AGENT_ACTION'
  | 'EXPERT_REVIEW_COMPLETE'
  | 'WATERING_REMINDER'
  | 'DISEASE_ALERT'
  | 'COMMUNITY_COMMENT'
  | 'COMMUNITY_LIKE'
  | 'LIKE_POST'
  | 'COMMENT_POST'
  | 'REPLY_COMMENT'
  | 'FOLLOW_USER'
  | 'NEW_POST_FROM_FOLLOWING'
  | 'REPORT_RESOLVED'
  | 'BADGE_EARNED'
  | 'EXPERT_LEVEL_UP'
  | 'CONSULTATION_REQUEST'
  | 'CONSULTATION_ACCEPTED'
  | 'CONSULTATION_REJECTED';

export interface INotification extends Document {
  user: Types.ObjectId; // Receiver (keep 'user' for backward compatibility, mapped to receiverId)
  actorId?: Types.ObjectId; // Sender/Actor
  senderName?: string;
  senderImage?: string;

  title: string;
  body: string;
  titleAr?: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;

  type: NotificationType;
  
  // Specific Deep Linking Identifiers
  postId?: Types.ObjectId;
  commentId?: Types.ObjectId;
  plantId?: Types.ObjectId;
  expertId?: Types.ObjectId;
  entityId?: Types.ObjectId; // Generic entityId for CommunityNotifications compatibility
  entityType?: string; // e.g., 'CommunityPost', 'CommentV2', 'User'

  image?: string; // Optional thumbnail
  deepLink?: string;

  data: Record<string, any>; // Arbitrary additional data
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String },
    senderImage: { type: String },

    title: { type: String, required: true },
    body: { type: String, required: true },
    titleAr: { type: String },
    titleEn: { type: String },
    bodyAr: { type: String },
    bodyEn: { type: String },

    type: {
      type: String,
      enum: [
        'LIKE', 'COMMENT', 'REPLY', 'MENTION', 'FOLLOW', 'EXPERT_REPLY', 'AI_DIAGNOSIS', 'REMINDER', 'GARDEN_ALERT',
        'GENERAL', 'OUTBREAK_ALERT', 'AGENT_ACTION', 'EXPERT_REVIEW_COMPLETE', 'WATERING_REMINDER', 'DISEASE_ALERT',
        'COMMUNITY_COMMENT', 'COMMUNITY_LIKE', 'LIKE_POST', 'COMMENT_POST', 'REPLY_COMMENT', 'FOLLOW_USER',
        'NEW_POST_FROM_FOLLOWING', 'REPORT_RESOLVED', 'BADGE_EARNED', 'EXPERT_LEVEL_UP', 'CONSULTATION_REQUEST',
        'CONSULTATION_ACCEPTED', 'CONSULTATION_REJECTED'
      ],
      default: 'GENERAL'
    },

    postId: { type: mongoose.Schema.Types.ObjectId },
    commentId: { type: mongoose.Schema.Types.ObjectId },
    plantId: { type: mongoose.Schema.Types.ObjectId },
    expertId: { type: mongoose.Schema.Types.ObjectId },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityType: { type: String },

    image: { type: String },
    deepLink: { type: String },

    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
// Fast query for unread
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);


