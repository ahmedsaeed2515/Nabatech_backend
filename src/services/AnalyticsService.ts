import { AnalyticsSnapshotRepository } from '../repositories/AnalyticsSnapshotRepository';
import { CareActionRepository } from '../repositories/CareActionRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { PlantRepository } from '../repositories/PlantRepository';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import redisClient from '../config/redis';

export const aiAnalysisQueue = redisClient
  ? new Queue('ai.analysis', { connection: redisClient as any })
  : null;

export class AnalyticsService {
  private snapshotRepo: AnalyticsSnapshotRepository;
  private careActionRepo: CareActionRepository;
  private taskRepo: TaskRepository;
  private plantRepo: PlantRepository;

  constructor() {
    this.snapshotRepo = new AnalyticsSnapshotRepository();
    this.careActionRepo = new CareActionRepository();
    this.taskRepo = new TaskRepository();
    this.plantRepo = new PlantRepository();
  }

  async generateWeeklySnapshot(userId: string) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const objectIdUser = new mongoose.Types.ObjectId(userId);

    // Aggregation 1: Most watered plant
    const careActions = await this.careActionRepo.aggregateCareActions([
      { $match: { user: objectIdUser, type: 'WATER', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$plant', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const mostWateredPlant = careActions.length > 0 ? careActions[0]._id : null;

    // Aggregation 2: Task completion rate
    const tasks = await this.taskRepo.aggregateTasks([
      { $match: { user: objectIdUser, dueDate: { $gte: start, $lte: end } } },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } }
        }
      }
    ]);

    const taskStats = tasks.length > 0 ? tasks[0] : { total: 0, completed: 0 };
    const taskCompletionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

    const snapshot = await this.snapshotRepo.create({
      user: objectIdUser as any,
      mostWateredPlant: mostWateredPlant as any,
      taskCompletionRate,
      periodStart: start,
      periodEnd: end
    });

    return snapshot;
  }

  async triggerAiAnalysis(userId: string) {
    // Add job to BullMQ queue
    await aiAnalysisQueue?.add('analyzeGarden', { userId });
    return { status: 'queued', message: 'AI analysis has been queued' };
  }
}
