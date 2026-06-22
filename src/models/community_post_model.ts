import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPost extends Document {
  author: mongoose.Types.ObjectId;
  authorName: string;
  plantTag: string;
  title: string;
  content: string;
  likes: number;
  commentsCount: number;
  imagePath?: string;
  imagePublicId?: string;
  imageUrls: string[];
  viewsCount: number;
  isPinned: boolean;
  poll?: mongoose.Types.ObjectId;
  likedBy: mongoose.Types.ObjectId[];
  status: "visible" | "hidden" | "removed" | "resolved";
  moderationReason?: string;
  moderationNotes?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  clientOperationId?: string;
  linkedDiagnosis?: mongoose.Types.ObjectId;
  version: number;
  lastEditedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorName: { type: String, required: true },
    plantTag: { type: String, enum: ["Diagnosis", "Care Tips", "Watering", "Pests", "General"], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    imagePath: { type: String, default: "" },
    imagePublicId: { type: String },
    imageUrls: [{ type: String }],
    viewsCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    poll: { type: Schema.Types.ObjectId, ref: "CommunityPoll" },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["visible", "hidden", "removed", "resolved"], default: "visible" },
    moderationReason: { type: String },
    moderationNotes: { type: String },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    clientOperationId: { type: String, index: true },
    linkedDiagnosis: { type: Schema.Types.ObjectId, ref: "DiagnosisHistory" },
    version: { type: Number, default: 0 },
    lastEditedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for feed and idempotency
communityPostSchema.index({ status: 1, createdAt: -1, _id: -1 });
communityPostSchema.index({ author: 1, clientOperationId: 1 }, { unique: true, sparse: true });
communityPostSchema.index({ title: "text", content: "text", plantTag: "text" });

export default mongoose.model<ICommunityPost>("CommunityPost", communityPostSchema);
