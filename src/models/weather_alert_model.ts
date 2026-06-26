import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface WeatherAlert extends Document {
  user: Types.ObjectId;
  zone?: Types.ObjectId;
  severity: AlertSeverity;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const weatherAlertSchema = new Schema<WeatherAlert>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
  severity: { type: String, enum: Object.values(AlertSeverity), default: AlertSeverity.INFO },
  message: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

weatherAlertSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<WeatherAlert>('WeatherAlert', weatherAlertSchema);


