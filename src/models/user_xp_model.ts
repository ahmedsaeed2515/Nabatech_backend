import mongoose, { Schema, Document, Types } from 'mongoose';

export interface UserXp extends Document {
  user: Types.ObjectId;
  totalXp: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const userXpSchema = new Schema<UserXp>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  totalXp: { type: Number, default: 0 },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

userXpSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<UserXp>('UserXp', userXpSchema);
