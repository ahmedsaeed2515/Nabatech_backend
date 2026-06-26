import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityAudit extends Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: any;
  createdAt: Date;
}

const CommunityAuditSchema = new Schema<ICommunityAudit>({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

CommunityAuditSchema.index({ actor: 1, createdAt: -1 });
CommunityAuditSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
CommunityAuditSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model<ICommunityAudit>('CommunityAudit', CommunityAuditSchema);


