import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPollVote extends Document {
  poll: mongoose.Types.ObjectId;
  option: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const communityPollVoteSchema = new Schema<ICommunityPollVote>(
  {
    poll: { type: Schema.Types.ObjectId, ref: "CommunityPoll", required: true },
    option: { type: Schema.Types.ObjectId, ref: "CommunityPollOption", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

communityPollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });

export default mongoose.model<ICommunityPollVote>("CommunityPollVote", communityPollVoteSchema);


