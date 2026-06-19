import mongoose, { Schema, Document, Types } from 'mongoose';

export enum FertilizerType {
  LIQUID = 'LIQUID',
  GRANULAR = 'GRANULAR',
  SLOW_RELEASE = 'SLOW_RELEASE',
  ORGANIC = 'ORGANIC',
  NPK = 'NPK',
  CUSTOM = 'CUSTOM'
}

export interface FertilizerLog extends Document {
  user: Types.ObjectId;
  plant: Types.ObjectId;
  fertilizerType: FertilizerType;
  amountGrams: number;
  fertilizedAt: Date;
  note?: string;
  clientOperationId?: string;
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
  plant: { type: Schema.Types.ObjectId, ref: 'MyPlant', required: true, index: true },
  fertilizerType: { type: String, enum: Object.values(FertilizerType), required: true },
  amountGrams: { type: Number, required: true },
  fertilizedAt: { type: Date, required: true, default: Date.now },
  note: { type: String },
  clientOperationId: { type: String, trim: true },
  // Legacy fields (optional) to preserve old data
  type: { type: String, enum: Object.values(FertilizerType) },
  amount: { type: String },
  date: { type: Date },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

fertilizerLogSchema.index({ user: 1, clientOperationId: 1 }, { unique: true, sparse: true });

fertilizerLogSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<FertilizerLog>('FertilizerLog', fertilizerLogSchema);
