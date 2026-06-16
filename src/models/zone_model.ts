import mongoose, { Document, Types } from 'mongoose';

export enum ZoneType {
  FULL_SUN = 'FULL_SUN',
  PARTIAL_SHADE = 'PARTIAL_SHADE',
  FULL_SHADE = 'FULL_SHADE',
  INDOOR_WINDOW = 'INDOOR_WINDOW',
  GROW_TENT = 'GROW_TENT'
}

export interface Zone extends Document {
  user: Types.ObjectId;
  garden: Types.ObjectId;
  name: string;
  type: ZoneType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const zoneSchema = new mongoose.Schema<Zone>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  garden: { type: mongoose.Schema.Types.ObjectId, ref: 'Garden', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(ZoneType), default: ZoneType.PARTIAL_SHADE },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Exclude soft-deleted records from basic queries
zoneSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<Zone>('Zone', zoneSchema);
