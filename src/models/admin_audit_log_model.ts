import mongoose, { Document } from "mongoose";

export interface AdminAuditLog extends Document {
  admin: mongoose.Types.ObjectId;
  action: string;
  targetUser?: mongoose.Types.ObjectId | null;
  targetUsers?: mongoose.Types.ObjectId[]; // For bulk actions
  details?: any;
  createdAt: Date;
  updatedAt: Date;
}

const adminAuditLogSchema = new mongoose.Schema<AdminAuditLog>({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  details: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true
});

// Indexes for fast querying by admin or action
adminAuditLogSchema.index({ admin: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetUser: 1, createdAt: -1 });

export default mongoose.model<AdminAuditLog>('AdminAuditLog', adminAuditLogSchema);
