import mongoose, { Document } from 'mongoose';

export interface PlantDna extends Document {
  species: string;
  scientificName: string;
  toxicity: boolean;
  minTemp: number;
  maxTemp: number;
  lightReq: string;
  waterFrequencyDays: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const plantDnaSchema = new mongoose.Schema<PlantDna>({
  species: { type: String, required: true, unique: true },
  scientificName: { type: String, required: true },
  toxicity: { type: Boolean, default: false },
  minTemp: { type: Number, required: true },
  maxTemp: { type: Number, required: true },
  lightReq: { type: String, required: true },
  waterFrequencyDays: { type: Number, required: true, default: 7 },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Exclude soft-deleted records from basic queries
plantDnaSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<PlantDna>('PlantDna', plantDnaSchema);
