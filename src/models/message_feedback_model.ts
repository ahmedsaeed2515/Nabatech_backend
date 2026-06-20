import { Schema, model, Types, Document } from "mongoose";

export interface IMessageFeedback extends Document {
  message: Types.ObjectId;
  user: Types.ObjectId;
  rating: "upvote" | "downvote";
  textFeedback?: string;
  isHallucination: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageFeedbackSchema = new Schema<IMessageFeedback>(
  {
    message: { type: Schema.Types.ObjectId, ref: "Message", required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: String, enum: ["upvote", "downvote"], required: true },
    textFeedback: { type: String },
    isHallucination: { type: Boolean, default: false },
    category: { type: String },
  },
  { timestamps: true }
);

messageFeedbackSchema.index({ user: 1, createdAt: -1 });
messageFeedbackSchema.index({ isHallucination: 1 });
messageFeedbackSchema.index({ rating: 1 });

export default model<IMessageFeedback>("MessageFeedback", messageFeedbackSchema);
