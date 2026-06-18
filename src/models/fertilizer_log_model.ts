import mongoose, { Schema, Document, Types } from 'mongoose';

export enum FertilizerType {
  LIQUID = 'LIQUID',
  GRANULAR = 'GRANULAR',
  SLOW_RELEASE = 'SLOW_RELEASE',
  ORGANIC = 'ORGANIC'
}

export interface FertilizerLog extends Document {
  user: Types.ObjectId;
  plant: Types.ObjectId;
  // New field names
  fertilizerType: FertilizerType;
  amountGrams: string;
  fertilizedAt: Date;
  note?: string;
  // Legacy fields for backward compatibility (optional)
  type?: FertilizerType;
  amount?: string;
  date?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const fertilizerLogSchema = new Schema<FertilizerLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
  fertilizerType: { type: String, enum: Object.values(FertilizerType), required: true },
  amountGrams: { type: String, required: true },
  fertilizedAt: { type: Date, required: true, default: Date.now },
  note: { type: String },
  // Legacy fields (optional) to preserve old data
  type: { type: String, enum: Object.values(FertilizerType) },
  amount: { type: String },
  date: { type: Date },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

fertilizerLogSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<FertilizerLog>('FertilizerLog', fertilizerLogSchema);
