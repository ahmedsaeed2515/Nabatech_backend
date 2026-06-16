import mongoose, { Document, Schema } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  body: string;
  imageUrl?: string;
  url?: string; // Optional external link if they want to link out, otherwise we show content
  source?: string;
  isPublished: boolean;
  tags: string[]; // Useful for matching with RAG topics
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    imageUrl: { type: String },
    url: { type: String },
    source: { type: String },
    isPublished: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

// Index for text search
articleSchema.index({ title: 'text', body: 'text', tags: 'text' });

export const Article = mongoose.model<IArticle>('Article', articleSchema);
