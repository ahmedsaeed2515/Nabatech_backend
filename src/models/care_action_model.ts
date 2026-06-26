import mongoose, { Schema, Document, Types } from 'mongoose';

export enum CareActionType {
  WATER = 'WATER',
  PRUNE = 'PRUNE',
  MIST = 'MIST',
  REPOTTING = 'REPOTTING',
  FERTILIZER = 'FERTILIZER',
  OTHER = 'OTHER'
}

export interface CareAction extends Document {
  user: Types.ObjectId;
  plant: Types.ObjectId;
  type: CareActionType;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const careActionSchema = new Schema<CareAction>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
  type: { type: String, enum: Object.values(CareActionType), required: true },
  date: { type: Date, required: true },
  notes: { type: String },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

careActionSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<CareAction>('CareAction', careActionSchema);


