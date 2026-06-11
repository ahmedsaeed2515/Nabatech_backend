import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordResetRequest extends Document {
  email: string;
  tokenHash: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  usedAt?: Date;
  requestIpHash?: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetRequestSchema = new Schema<IPasswordResetRequest>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, trim: true },
    deliveryStatus: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
    usedAt: { type: Date },
    requestIpHash: { type: String },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

passwordResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetRequestSchema.index({ tokenHash: 1 }, { unique: true, sparse: true, partialFilterExpression: { used: false } });

export default mongoose.model<IPasswordResetRequest>(
  "PasswordResetRequest",
  passwordResetRequestSchema
);

