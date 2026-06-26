import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { dailyTasksSchema } from '../validation/v2';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  getDailyTasks = async (req: Request, res: Response) => {
    try {
      const parsed = dailyTasksSchema.parse(req.query);
      const userId = (req as any).user._id || (req as any).user.userId;
      
      const tasks = await this.taskService.getDailyTasks(userId, new Date(parsed.date));
      res.status(200).json({ status: 'success', data: tasks });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  completeTask = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user._id || (req as any).user.userId;
      
      const task = await this.taskService.completeTask(id as string, userId);
      res.status(200).json({ status: 'success', data: task });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  createTask = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { title, dueDate, plantId } = req.body;
      const task = await this.taskService.createTask(userId, title, new Date(dueDate), plantId);
      res.status(201).json({ status: 'success', data: task });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  updateTask = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user._id || (req as any).user.userId;
      const data = req.body;
      
      const task = await this.taskService.updateTask(id as string, userId, data);
      if (!task) {
        return res.status(404).json({ status: 'error', message: 'Task not found' });
      }
      res.status(200).json({ status: 'success', data: task });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deleteTask = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user._id || (req as any).user.userId;
      
      const success = await this.taskService.deleteTask(id as string, userId);
      if (!success) {
        return res.status(404).json({ status: 'error', message: 'Task not found' });
      }
      res.status(200).json({ status: 'success', message: 'Task deleted' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


