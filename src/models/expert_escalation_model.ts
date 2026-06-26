import mongoose, { Document, Schema } from "mongoose";

export interface IExpertEscalation extends Document {
  userId: string;
  imagePath?: string;
  aiPrediction?: string;
  aiConfidence?: number;
  userContext?: string;
  status: "pending" | "claimed" | "reviewed" | "rejected" | "resolved";
  expertId?: string;
  expertResponse?: string;
  assignedAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expertEscalationSchema = new Schema<IExpertEscalation>(
  {
    userId: { type: String, required: true, index: true },
    imagePath: { type: String },
    aiPrediction: { type: String },
    aiConfidence: { type: Number },
    userContext: { type: String },
    status: { type: String, enum: ["pending", "claimed", "reviewed", "rejected", "resolved"], default: "pending", index: true },
    expertId: { type: String },
    expertResponse: { type: String },
    assignedAdminId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IExpertEscalation>("ExpertEscalation", expertEscalationSchema);


