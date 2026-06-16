import mongoose, { Schema, Document, Types } from 'mongoose';

export interface CalendarEvent extends Document {
  user: Types.ObjectId;
  date: Date;
  tasks: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const calendarEventSchema = new Schema<CalendarEvent>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

calendarEventSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

// Ensure a single calendar event per user per date (ignoring time)
calendarEventSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model<CalendarEvent>('CalendarEvent', calendarEventSchema);
