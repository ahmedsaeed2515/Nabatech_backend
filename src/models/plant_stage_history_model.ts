import mongoose, { Schema, Document, Types } from 'mongoose';
import { PlantStage } from './plant_model';

export interface PlantStageHistory extends Document {
  user: Types.ObjectId;
  plant: Types.ObjectId;
  stage: PlantStage;
  enteredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const plantStageHistorySchema = new Schema<PlantStageHistory>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
  stage: { type: String, enum: Object.values(PlantStage), required: true },
  enteredAt: { type: Date, required: true, default: Date.now },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

plantStageHistorySchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<PlantStageHistory>('PlantStageHistory', plantStageHistorySchema);
