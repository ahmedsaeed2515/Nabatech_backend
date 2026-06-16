import { TaskRepository } from '../repositories/TaskRepository';
import { CalendarEventRepository } from '../repositories/CalendarEventRepository';
import { TaskStatus } from '../models/task_model';

export class TaskService {
  private taskRepo: TaskRepository;
  private calendarEventRepo: CalendarEventRepository;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.calendarEventRepo = new CalendarEventRepository();
  }

  async getDailyTasks(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await this.taskRepo.findByDate(userId, startOfDay, endOfDay);
    return tasks;
  }

  async completeTask(taskId: string, userId: string) {
    const task = await this.taskRepo.findOne({ _id: taskId, user: userId });
    if (!task) throw new Error('Task not found');
    
    task.status = TaskStatus.COMPLETED;
    await task.save();

    return task;
  }
}
