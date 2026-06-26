import mongoose, { Schema, Document, Types } from 'mongoose';

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface TaskModel extends Document {
  user: Types.ObjectId;
  plant?: Types.ObjectId;
  title: string;
  dueDate: Date;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const taskSchema = new Schema<TaskModel>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plant: { type: Schema.Types.ObjectId, ref: 'Plant' },
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.PENDING },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

taskSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<TaskModel>('Task', taskSchema);


