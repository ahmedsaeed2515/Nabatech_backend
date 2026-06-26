import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshSession extends Document {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  familyId: string;
  deviceId?: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByHash?: string;
  reuseDetectedAt?: Date;
  lastUsedAt: Date;
}

const RefreshSessionSchema = new Schema<IRefreshSession>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  familyId: { type: String, required: true, index: true },
  deviceId: { type: String },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date },
  replacedByHash: { type: String },
  reuseDetectedAt: { type: Date },
  lastUsedAt: { type: Date, default: Date.now }
}, { timestamps: true });

RefreshSessionSchema.index({ user: 1, deviceId: 1 });
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRefreshSession>('RefreshSession', RefreshSessionSchema);


