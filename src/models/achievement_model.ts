import mongoose, { Schema, Document } from 'mongoose';

export interface Achievement extends Document {
  name: string;
  description: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const achievementSchema = new Schema<Achievement>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

achievementSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<Achievement>('Achievement', achievementSchema);
