import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityNotification extends Document {
  userId: mongoose.Types.ObjectId; // The user receiving the notification
  actorId: mongoose.Types.ObjectId; // The user who performed the action
  type: 'LIKE_POST' | 'COMMENT_POST' | 'FOLLOW_USER' | 'REPORT_RESOLVED' | 'BADGE_EARNED' | 'EXPERT_LEVEL_UP';
  entityId: mongoose.Types.ObjectId; // Post ID, Comment ID, Report ID, etc.
  entityType: 'CommunityPost' | 'CommentV2' | 'User' | 'CommunityReport';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communityNotificationSchema = new Schema<ICommunityNotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['LIKE_POST', 'COMMENT_POST', 'FOLLOW_USER', 'REPORT_RESOLVED', 'BADGE_EARNED', 'EXPERT_LEVEL_UP'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['CommunityPost', 'CommentV2', 'User', 'CommunityReport'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query for fetching a user's unread and recent notifications
communityNotificationSchema.index({ userId: 1, createdAt: -1 });
communityNotificationSchema.index({ userId: 1, read: 1 });

const CommunityNotification = mongoose.model<ICommunityNotification>('CommunityNotification', communityNotificationSchema);

export default CommunityNotification;
