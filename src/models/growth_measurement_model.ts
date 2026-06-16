import mongoose, { Schema, Document, Types } from 'mongoose';
import { PlantStage } from './plant_model';

export interface GrowthMeasurement extends Document {
  user: Types.ObjectId;
  plant: Types.ObjectId;
  heightCm?: number;
  leafCount?: number;
  stage?: PlantStage;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const growthMeasurementSchema = new Schema<GrowthMeasurement>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
  heightCm: { type: Number },
  leafCount: { type: Number },
  stage: { type: String, enum: Object.values(PlantStage) },
  photoUrl: { type: String },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

growthMeasurementSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<GrowthMeasurement>('GrowthMeasurement', growthMeasurementSchema);
