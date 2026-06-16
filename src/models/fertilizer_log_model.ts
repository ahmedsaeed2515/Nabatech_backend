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
  type: FertilizerType;
  amount: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const fertilizerLogSchema = new Schema<FertilizerLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
  type: { type: String, enum: Object.values(FertilizerType), required: true },
  amount: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

fertilizerLogSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<FertilizerLog>('FertilizerLog', fertilizerLogSchema);
