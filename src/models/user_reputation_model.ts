import mongoose, { Document, Schema } from 'mongoose';

export enum ExpertLevel {
  NOVICE = 'Novice',
  REGULAR = 'Regular',
  EXPERT = 'Expert',
  MASTER = 'Master',
}

export interface IUserReputation extends Document {
  userId: mongoose.Types.ObjectId;
  points: number;
  level: ExpertLevel;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userReputationSchema = new Schema<IUserReputation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0, index: -1 }, // Index for sorting by points descending
    level: { type: String, enum: Object.values(ExpertLevel), default: ExpertLevel.NOVICE },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IUserReputation>('UserReputation', userReputationSchema);


