import mongoose, { Document, Schema } from 'mongoose';

export interface IDiseaseKnowledgeRecord extends Document {
  diseaseNameEn: string;
  diseaseNameAr: string;
  severity: 'low' | 'medium' | 'high';
  advice: string;
  description?: string;
  symptoms?: string[];
  treatment?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DiseaseKnowledgeRecordSchema: Schema = new Schema(
  {
    diseaseNameEn: { type: String, required: true, unique: true },
    diseaseNameAr: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
    },
    advice: { type: String, required: true },
    description: { type: String },
    symptoms: { type: [String], default: [] },
    treatment: { type: [String], default: [] },
  },
  {
    timestamps: true,
    collection: 'disease_knowledge_records',
  }
);

export const DiseaseKnowledgeRecord = mongoose.model<IDiseaseKnowledgeRecord>(
  'DiseaseKnowledgeRecord',
  DiseaseKnowledgeRecordSchema
);
