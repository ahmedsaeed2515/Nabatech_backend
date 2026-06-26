import mongoose, { Schema, Document, Types } from 'mongoose';

export interface AnalyticsSnapshot extends Document {
  user: Types.ObjectId;
  mostWateredPlant?: Types.ObjectId | null;
  taskCompletionRate: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const analyticsSnapshotSchema = new Schema<AnalyticsSnapshot>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mostWateredPlant: { type: Schema.Types.ObjectId, ref: 'Plant', default: null },
  taskCompletionRate: { type: Number, required: true, default: 0 },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

analyticsSnapshotSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<AnalyticsSnapshot>('AnalyticsSnapshot', analyticsSnapshotSchema);


