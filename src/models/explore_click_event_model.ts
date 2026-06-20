import mongoose, { Schema, Document } from "mongoose";

export interface IExploreClickEvent extends Document {
  user?: mongoose.Types.ObjectId;
  contentType: 'article' | 'product' | 'expert' | 'post' | 'plant' | 'section';
  contentId: string;
  actionType: 'view' | 'click' | 'bookmark' | 'share';
  section: string;
  abGroup: 'A' | 'B';
  createdAt: Date;
}

const exploreClickEventSchema = new Schema<IExploreClickEvent>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    contentType: {
      type: String,
      required: true,
      enum: ['article', 'product', 'expert', 'post', 'plant', 'section'],
      index: true
    },
    contentId: { type: String, required: true, index: true },
    actionType: {
      type: String,
      required: true,
      enum: ['view', 'click', 'bookmark', 'share'],
      index: true
    },
    section: { type: String, required: true, index: true },
    abGroup: {
      type: String,
      required: true,
      enum: ['A', 'B'],
      default: 'A',
      index: true
    },
    createdAt: { type: Date, default: Date.now, index: true }
  }
);

export default mongoose.model<IExploreClickEvent>("ExploreClickEvent", exploreClickEventSchema);
