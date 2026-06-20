import mongoose, { Document } from 'mongoose';

export interface PlantTag extends Document {
  nameAr: string;
  nameEn: string;
  slug: string;
  colorHex?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const plantTagSchema = new mongoose.Schema<PlantTag>({
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  colorHex: { type: String, default: '#4CAF50' },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

plantTagSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<PlantTag>('PlantTag', plantTagSchema);
