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
  isLibraryItem?: boolean;
  zone?: Types.ObjectId;
  dna?: Types.ObjectId;
  user?: Types.ObjectId;
  name?: string;
  imageUrl: string;
  stage: PlantStage;
  healthScore: number;
  lastWatered?: Date;
  // New optional fields from multilingual and detailed plant data
  nameAr?: string;
  nameEn?: string;
  scientificName?: string;
  category?: string;
  careLevel?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  waterRequirements?: string;
  lightRequirements?: string;
  humidityRequirements?: string;
  soilRequirements?: string;
  fertilizerRequirements?: string;
  growthRate?: string;
  matureSize?: string;
  temperatureRange?: string;
  // Additional timestamp for last fertilization
  lastFertilized?: Date;
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
  isLibraryItem: { type: Boolean, default: false },
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', index: true },
  dna: { type: mongoose.Schema.Types.ObjectId, ref: 'PlantDna' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String },
  nameAr: { type: String },
  nameEn: { type: String },
  scientificName: { type: String },
  category: { type: String },
  careLevel: { type: String },
  descriptionAr: { type: String },
  descriptionEn: { type: String },
  waterRequirements: { type: String },
  lightRequirements: { type: String },
  humidityRequirements: { type: String },
  soilRequirements: { type: String },
  fertilizerRequirements: { type: String },
  growthRate: { type: String },
  matureSize: { type: String },
  temperatureRange: { type: String },
  imageUrl: { type: String, default: '' },
  stage: { type: String, enum: Object.values(PlantStage), default: PlantStage.SEED },
  healthScore: { type: Number, default: 100 },
  lastWatered: { type: Date },
  lastFertilized: { type: Date },
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
