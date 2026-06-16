import mongoose, { Schema, Document, Types } from 'mongoose';

export enum VoiceCommandStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UNKNOWN_INTENT = 'UNKNOWN_INTENT'
}

export interface VoiceCommand extends Document {
  user: Types.ObjectId;
  transcript: string;
  intent?: string;
  status: VoiceCommandStatus;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const voiceCommandSchema = new Schema<VoiceCommand>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  transcript: { type: String, required: true },
  intent: { type: String },
  status: { type: String, enum: Object.values(VoiceCommandStatus), required: true },
  response: { type: String },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

voiceCommandSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<VoiceCommand>('VoiceCommand', voiceCommandSchema);
