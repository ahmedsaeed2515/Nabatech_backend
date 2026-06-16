import mongoose, { Document, Types } from 'mongoose';

export enum PlantStage {
  SEED = 'SEED',
  SPROUT = 'SPROUT',
  VEGETATIVE = 'VEGETATIVE',
  FLOWERING = 'FLOWERING',
  FRUITING = 'FRUITING',
  MATURE = 'MATURE',
  DEAD = 'DEAD'
}

export interface Plant extends Document {
  zone: Types.ObjectId;
  dna: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  imageUrl: string;
  stage: PlantStage;
  healthScore: number;
  lastWatered?: Date;
  toxicityLevel?: string;
  wateringFrequency?: string;
  careInstructions?: string;
  commonProblems?: string;
  propagationMethod?: string;
  nativeRegion?: string;
  plantBenefits?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const plantSchema = new mongoose.Schema<Plant>({
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true, index: true },
  dna: { type: mongoose.Schema.Types.ObjectId, ref: 'PlantDna', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  stage: { type: String, enum: Object.values(PlantStage), default: PlantStage.SEED },
  healthScore: { type: Number, default: 100 },
  lastWatered: { type: Date },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Exclude soft-deleted records from basic queries
plantSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<Plant>('Plant', plantSchema);
