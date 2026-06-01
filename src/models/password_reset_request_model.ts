import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordResetRequest extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetRequestSchema = new Schema<IPasswordResetRequest>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    token: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPasswordResetRequest>(
  "PasswordResetRequest",
  passwordResetRequestSchema
);

