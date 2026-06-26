import mongoose, { Document, Schema } from 'mongoose';

export interface IPlantIdentificationHistory extends Document {
  user: mongoose.Types.ObjectId;
  imageUrl: string;
  identifiedSpecies: string;
  confidenceScore: number;
  aiProvider: string;
  isAddedToGarden: boolean;
  rawResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PlantIdentificationHistorySchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    identifiedSpecies: { type: String, required: true },
    confidenceScore: { type: Number, required: true },
    aiProvider: { type: String, default: 'gemini_vision' },
    isAddedToGarden: { type: Boolean, default: false },
    rawResponse: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes
PlantIdentificationHistorySchema.index({ user: 1, createdAt: -1 });
PlantIdentificationHistorySchema.index({ identifiedSpecies: 1 });

const PlantIdentificationHistoryModel = mongoose.model<IPlantIdentificationHistory>(
  'PlantIdentificationHistory',
  PlantIdentificationHistorySchema
);

export default PlantIdentificationHistoryModel;


