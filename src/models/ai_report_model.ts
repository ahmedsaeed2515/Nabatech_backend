import mongoose, { Schema, Document, Types } from 'mongoose';

export interface AiReport extends Document {
  user: Types.ObjectId;
  score: number;
  urgentActions: string[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const aiReportSchema = new Schema<AiReport>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  score: { type: Number, required: true, default: 100 },
  urgentActions: [{ type: String }],
  summary: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

aiReportSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<AiReport>('AiReport', aiReportSchema);


