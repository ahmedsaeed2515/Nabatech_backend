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
  likedBy: mongoose.Types.ObjectId[];
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
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model<ICommunityPost>("CommunityPost", communityPostSchema);
