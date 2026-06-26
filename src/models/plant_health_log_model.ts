import mongoose, { Schema, Document, Types } from 'mongoose';

export interface PlantHealthLog extends Document {
  user: Types.ObjectId;
  plant: Types.ObjectId;
  score: number;
  issues?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const plantHealthLogSchema = new Schema<PlantHealthLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
  score: { type: Number, required: true },
  issues: [{ type: String }],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

plantHealthLogSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<PlantHealthLog>('PlantHealthLog', plantHealthLogSchema);


