import mongoose, { Schema, Document, Types } from 'mongoose';

export interface WishlistItem extends Document {
  user: Types.ObjectId;
  species: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const wishlistItemSchema = new Schema<WishlistItem>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  species: { type: String, required: true },
  notes: { type: String, required: false },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

wishlistItemSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<WishlistItem>('WishlistItem', wishlistItemSchema);


