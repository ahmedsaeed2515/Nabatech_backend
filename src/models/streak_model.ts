import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Streak extends Document {
  user: Types.ObjectId;
  current: number;
  longest: number;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const streakSchema = new Schema<Streak>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  current: { type: Number, default: 0 },
  longest: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

streakSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<Streak>('Streak', streakSchema);
