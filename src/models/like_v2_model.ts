import mongoose, { Schema, Document, Types } from 'mongoose';

export interface LikeV2 extends Document {
  post: Types.ObjectId;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const likeSchema = new Schema<LikeV2>({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Compound unique index on post+user
likeSchema.index({ post: 1, user: 1 }, { unique: true });

likeSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<LikeV2>('LikeV2', likeSchema);
