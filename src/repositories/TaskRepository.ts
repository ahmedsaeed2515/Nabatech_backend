import { BaseRepository } from './BaseRepository';
import TaskModel, { TaskModel as Task } from '../models/task_model';

export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super(TaskModel);
  }

  async findByDate(userId: string, dateStart: Date, dateEnd: Date): Promise<Task[]> {
    return this.model.find({
      dueDate: { $gte: dateStart, $lt: dateEnd }
    }).where('user').equals(userId).populate('plant').exec();
  }

  async findPendingByDate(userId: string, dateStart: Date, dateEnd: Date): Promise<Task[]> {
    return this.model.find({
      status: 'PENDING',
      dueDate: { $gte: dateStart, $lt: dateEnd }
    }).where('user').equals(userId).exec();
  }

  async checkPendingTask(plantId: string, dateStart: Date): Promise<boolean> {
    const tasks = await this.model.find({
      plant: plantId,
      status: 'PENDING',
      dueDate: { $gte: dateStart }
    }).exec();
    return tasks.length > 0;
  }

  async findPendingForToday(dateStart: Date, dateEnd: Date): Promise<Task[]> {
    return this.model.find({
      status: 'PENDING',
      dueDate: { $gte: dateStart, $lte: dateEnd }
    }).exec();
  }

  async aggregateTasks(pipeline: any[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }
}
