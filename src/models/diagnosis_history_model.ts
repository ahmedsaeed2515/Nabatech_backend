import mongoose, { Document, Schema } from "mongoose";

export interface IDiagnosisHistory extends Document {
  user: mongoose.Types.ObjectId;
  imageUrl: string;
  diseaseNameAr: string;
  diseaseNameEn: string;
  confidence: number;
  severity: string;
  diagnosedAt: Date;
  isOffline: boolean;
  feedbackStatus: "pending" | "confirmed" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const diagnosisHistorySchema = new Schema<IDiagnosisHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, required: true },
    diseaseNameAr: { type: String, required: true },
    diseaseNameEn: { type: String, required: true },
    confidence: { type: Number, required: true },
    severity: { type: String, enum: ["low", "medium", "high", "منخفضة", "متوسطة", "عالية"], default: "medium" },
    diagnosedAt: { type: Date, default: Date.now },
    isOffline: { type: Boolean, default: false },
    feedbackStatus: { type: String, enum: ["pending", "confirmed", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model<IDiagnosisHistory>("DiagnosisHistory", diagnosisHistorySchema);
