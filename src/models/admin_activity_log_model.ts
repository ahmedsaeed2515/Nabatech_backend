import mongoose, { Document, Schema } from "mongoose";

export interface IAdminActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetId: mongoose.Types.ObjectId;
  targetModel: 'CommunityPost' | 'Comment' | 'User';
  details?: any;
  createdAt: Date;
  updatedAt: Date;
}

const adminActivityLogSchema = new Schema<IAdminActivityLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetModel: { type: String, enum: ['CommunityPost', 'Comment', 'User'], required: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

adminActivityLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model<IAdminActivityLog>('AdminActivityLog', adminActivityLogSchema);


