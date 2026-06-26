import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPollOption extends Document {
  poll: mongoose.Types.ObjectId;
  text: string;
  votes: number;
  sortOrder: number;
}

const communityPollOptionSchema = new Schema<ICommunityPollOption>(
  {
    poll: { type: Schema.Types.ObjectId, ref: "CommunityPoll", required: true, index: true },
    text: { type: String, required: true, maxlength: 200 },
    votes: { type: Number, default: 0 },
    sortOrder: { type: Number, required: true },
  },
  { timestamps: false }
);

export default mongoose.model<ICommunityPollOption>("CommunityPollOption", communityPollOptionSchema);


