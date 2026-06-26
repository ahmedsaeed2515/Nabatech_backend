import mongoose, { Document, Schema } from "mongoose";

export interface IExpertChatSession extends Document {
  farmerId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  status: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const expertChatSessionSchema = new Schema<IExpertChatSession>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expertId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true }
);

// Allow only one active session per farmer-expert pair (we can find the latest if we don't make it unique)
// expertChatSessionSchema.index({ farmerId: 1, expertId: 1 }, { unique: true });

export default mongoose.model<IExpertChatSession>("ExpertChatSession", expertChatSessionSchema);


