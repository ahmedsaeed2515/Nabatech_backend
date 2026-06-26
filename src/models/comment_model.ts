import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;
  text: string;
  status: "visible" | "hidden" | "removed";
  isHidden: boolean;
  isPinned: boolean;
  clientOperationId?: string;
  version: number;
  moderationReason?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  lastEditedAt?: Date;
  parentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ["visible", "hidden", "removed"], default: "visible" },
    isHidden: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    clientOperationId: { type: String, index: true },
    version: { type: Number, default: 0 },
    moderationReason: { type: String },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    lastEditedAt: { type: Date },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment" },
  },
  { timestamps: true }
);

// Indexes for feed and idempotency
commentSchema.index({ post: 1, createdAt: -1, _id: -1 });
commentSchema.index({ author: 1, post: 1, clientOperationId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IComment>("Comment", commentSchema);


