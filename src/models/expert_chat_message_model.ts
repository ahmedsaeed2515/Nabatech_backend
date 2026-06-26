import mongoose, { Document, Schema } from "mongoose";

export interface IExpertChatMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const expertChatMessageSchema = new Schema<IExpertChatMessage>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "ExpertChatSession", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExpertChatMessage>("ExpertChatMessage", expertChatMessageSchema);


