import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminAudit extends Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId: string;
  result: 'success' | 'failure';
  requestId?: string;
  beforeSummary?: any;
  afterSummary?: any;
  createdAt: Date;
}

const AdminAuditSchema = new Schema<IAdminAudit>({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  result: { type: String, enum: ['success', 'failure'], required: true },
  requestId: { type: String },
  beforeSummary: { type: Schema.Types.Mixed },
  afterSummary: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

AdminAuditSchema.index({ actor: 1, createdAt: -1 });
AdminAuditSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model<IAdminAudit>('AdminAudit', AdminAuditSchema);


