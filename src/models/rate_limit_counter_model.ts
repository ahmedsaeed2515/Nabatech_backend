import mongoose, { Document, Schema } from 'mongoose';

export interface IRateLimitCounter extends Document {
  key: string; // e.g., `login:email:IP`
  count: number;
  expiresAt: Date;
}

const RateLimitCounterSchema = new Schema<IRateLimitCounter>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL
});

export default mongoose.model<IRateLimitCounter>('RateLimitCounter', RateLimitCounterSchema);


