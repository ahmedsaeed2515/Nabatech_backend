import { Schema, model, Document } from "mongoose";

export interface IHomeSection extends Document {
  sectionId: string; // e.g., "featured_articles", "community_highlights"
  title: string;
  type: "articles" | "posts" | "products" | "custom";
  order: number;
  isActive: boolean;
  queryConfig: Record<string, any>; // JSON to power backend aggregation
}

const homeSectionSchema = new Schema<IHomeSection>({
  sectionId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["articles", "posts", "products", "custom"], required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  queryConfig: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default model<IHomeSection>("HomeSection", homeSectionSchema);


