import mongoose, { Schema, Document, Types } from 'mongoose';

export interface CommentV2 extends Document {
  post: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const commentSchema = new Schema<CommentV2>({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

commentSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<CommentV2>('CommentV2', commentSchema);


