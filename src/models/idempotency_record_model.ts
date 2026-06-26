import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  actor: mongoose.Types.ObjectId;
  scope: string;
  key: string;
  requestHash: string;
  state: 'started' | 'completed' | 'failed';
  statusCode?: number;
  resultReference?: any;
  expiresAt: Date;
}

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: String, required: true },
  key: { type: String, required: true },
  requestHash: { type: String, required: true },
  state: { type: String, enum: ['started', 'completed', 'failed'], default: 'started' },
  statusCode: { type: Number },
  resultReference: { type: Schema.Types.Mixed },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

IdempotencyRecordSchema.index({ actor: 1, scope: 1, key: 1 }, { unique: true });
IdempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IIdempotencyRecord>('IdempotencyRecord', IdempotencyRecordSchema);


