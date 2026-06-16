import mongoose, { Document, Schema } from "mongoose";

export interface IDiagnosisHistory extends Document {
  user: mongoose.Types.ObjectId;
  clientOperationId?: string;
  imagePublicId?: string;
  imageUrl: string;
  diseaseNameAr: string;
  diseaseNameEn: string;
  confidence: number;
  severity: string;
  diagnosedAt: Date;
  isOffline: boolean;
  diagnosisSource: 'online' | 'offline' | 'hybrid';
  feedbackStatus: "pending" | "confirmed" | "rejected";
  candidates?: Array<{ label: string; confidence: number }>;
  plantId?: mongoose.Types.ObjectId;
  modelId?: string;
  modelVersion?: string;
  provider?: string;
  source?: string;
  sourceIds?: string[];
  uncertain?: boolean;
  needsNewImage?: boolean;
  advice?: string;
  llmResponse?: string;
  cnnResult?: string;
  ragContext?: string[];
  retentionUntil?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const diagnosisHistorySchema = new Schema<IDiagnosisHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientOperationId: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    diseaseNameAr: { type: String, required: true },
    diseaseNameEn: { type: String, required: true },
    confidence: { type: Number, required: true },
    severity: { type: String, enum: ["low", "medium", "high", "منخفضة", "متوسطة", "عالية"], default: "medium" },
    diagnosedAt: { type: Date, default: Date.now },
    isOffline: { type: Boolean, default: false },
    diagnosisSource: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    feedbackStatus: { type: String, enum: ["pending", "confirmed", "rejected"], default: "pending" },
    candidates: { type: [{ label: String, confidence: Number }], default: [] },
    plantId: { type: Schema.Types.ObjectId, ref: "MyPlant", required: false },
    modelId: { type: String, default: "legacy_backend" },
    modelVersion: { type: String, default: "unknown" },
    provider: { type: String, default: "legacy" },
    source: { type: String, trim: true },
    sourceIds: { type: [String], default: [] },
    uncertain: { type: Boolean, default: false },
    needsNewImage: { type: Boolean, default: false },
    advice: { type: String, trim: true },
    llmResponse: { type: String, trim: true },
    cnnResult: { type: String, trim: true },
    ragContext: { type: [String], default: [] },
    retentionUntil: { type: Date, expires: 0 },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

diagnosisHistorySchema.index({ user: 1, diagnosedAt: -1, _id: -1 });
diagnosisHistorySchema.index({ diagnosedAt: -1 });
diagnosisHistorySchema.index({ feedbackStatus: 1, diagnosedAt: -1 });
diagnosisHistorySchema.index(
  { user: 1, clientOperationId: 1 },
  { unique: true, partialFilterExpression: { clientOperationId: { $exists: true, $type: "string" } } }
);

export default mongoose.model<IDiagnosisHistory>("DiagnosisHistory", diagnosisHistorySchema);
