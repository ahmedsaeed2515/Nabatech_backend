import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPoll extends Document {
  post: mongoose.Types.ObjectId;
  question: string;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const communityPollSchema = new Schema<ICommunityPoll>(
  {
    post: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true, unique: true, index: true },
    question: { type: String, required: true, maxlength: 500 },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICommunityPoll>("CommunityPoll", communityPollSchema);
