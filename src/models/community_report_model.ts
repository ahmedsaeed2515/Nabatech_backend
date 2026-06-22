import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedEntityId: mongoose.Types.ObjectId;
  entityModel: "CommunityPost" | "CommentV2";
  reason: "Spam" | "Wrong Diagnosis" | "Harassment" | "Fake Information" | "Other";
  details?: string;
  status: "Pending" | "Resolved" | "Dismissed";
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityReportSchema = new Schema<ICommunityReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportedEntityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityModel: { type: String, enum: ["CommunityPost", "CommentV2"], required: true },
    reason: {
      type: String,
      enum: ["Spam", "Wrong Diagnosis", "Harassment", "Fake Information", "Other"],
      required: true,
    },
    details: { type: String, maxlength: 500 },
    status: { type: String, enum: ["Pending", "Resolved", "Dismissed"], default: "Pending", index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate reports by the same user on the same entity
communityReportSchema.index({ reporterId: 1, reportedEntityId: 1 }, { unique: true });
communityReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ICommunityReport>("CommunityReport", communityReportSchema);
