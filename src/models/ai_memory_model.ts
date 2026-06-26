import mongoose, { Document, Schema } from "mongoose";

export interface IAiMemory extends Document {
  userId: string;
  type: "short_term" | "long_term";
  key: string;
  value: any;
  expiresAt?: Date; // Only used for short_term
  createdAt: Date;
  updatedAt: Date;
}

const aiMemorySchema = new Schema<IAiMemory>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["short_term", "long_term"], required: true },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

aiMemorySchema.index({ userId: 1, type: 1, key: 1 }, { unique: true });
// Optional TTL index for short_term memory
aiMemorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IAiMemory>("AiMemory", aiMemorySchema);


