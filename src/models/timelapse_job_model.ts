import mongoose, { Schema, Document, Types } from 'mongoose';

export enum TimelapseJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED'
}

export interface TimelapseJob extends Document {
  user: Types.ObjectId;
  plant: Types.ObjectId;
  status: TimelapseJobStatus;
  videoUrl?: string;
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const timelapseJobSchema = new Schema<TimelapseJob>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true },
  status: { type: String, enum: Object.values(TimelapseJobStatus), default: TimelapseJobStatus.PENDING },
  videoUrl: { type: String },
  errorLog: { type: String },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

timelapseJobSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<TimelapseJob>('TimelapseJob', timelapseJobSchema);
