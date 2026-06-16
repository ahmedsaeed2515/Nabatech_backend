import mongoose, { Document, Types } from 'mongoose';

export enum GardenType {
  INDOOR = 'INDOOR',
  OUTDOOR = 'OUTDOOR',
  GREENHOUSE = 'GREENHOUSE',
  BALCONY = 'BALCONY'
}

export interface Garden extends Document {
  user: Types.ObjectId;
  name: string;
  type: GardenType;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const gardenSchema = new mongoose.Schema<Garden>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(GardenType), default: GardenType.INDOOR },
  score: { type: Number, default: 0 },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Exclude soft-deleted records from basic queries
gardenSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<Garden>('Garden', gardenSchema);
