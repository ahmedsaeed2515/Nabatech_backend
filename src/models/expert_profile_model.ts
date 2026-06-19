import mongoose, { Document, Schema } from 'mongoose';

export interface IExpertProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  specialization?: string;
  yearsExperience?: number;
  expertPostsCount: number;
  expertRepliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const expertProfileSchema = new Schema<IExpertProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, trim: true },
    specialization: { type: String, trim: true },
    yearsExperience: { type: Number, min: 0 },
    expertPostsCount: { type: Number, default: 0 },
    expertRepliesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IExpertProfile>('ExpertProfile', expertProfileSchema);
