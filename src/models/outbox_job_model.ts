import mongoose, { Document, Schema } from 'mongoose';

export interface IOutboxJob extends Document {
  type: string;
  aggregateId: string;
  idempotencyKey: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  attemptCount: number;
  availableAt: Date;
  leaseUntil?: Date;
  lastError?: string;
  deadLetteredAt?: Date;
}

const OutboxJobSchema = new Schema<IOutboxJob>({
  type: { type: String, required: true, index: true },
  aggregateId: { type: String, required: true },
  idempotencyKey: { type: String, required: true, unique: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'dead_letter'], 
    default: 'pending' 
  },
  attemptCount: { type: Number, default: 0 },
  availableAt: { type: Date, default: Date.now },
  leaseUntil: { type: Date },
  lastError: { type: String },
  deadLetteredAt: { type: Date }
}, { timestamps: true });

OutboxJobSchema.index({ status: 1, availableAt: 1, leaseUntil: 1 });

export default mongoose.model<IOutboxJob>('OutboxJob', OutboxJobSchema);
