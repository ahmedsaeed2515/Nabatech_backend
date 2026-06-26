import mongoose, { Schema, Document } from 'mongoose';

export interface SeasonalRule extends Document {
  name: string;
  season: string;
  advice: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const seasonalRuleSchema = new Schema<SeasonalRule>({
  name: { type: String, required: true },
  season: { type: String, required: true },
  advice: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

seasonalRuleSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<SeasonalRule>('SeasonalRule', seasonalRuleSchema);


