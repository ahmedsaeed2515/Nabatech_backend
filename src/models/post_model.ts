import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Post extends Document {
  user: Types.ObjectId;
  content: string;
  imageUrl?: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const postSchema = new Schema<Post>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  imageUrl: { type: String, required: false },
  likesCount: { type: Number, default: 0 },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

postSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<Post>('Post', postSchema);


