"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = exports.aiAnalysisQueue = void 0;
const AnalyticsSnapshotRepository_1 = require("../repositories/AnalyticsSnapshotRepository");
const CareActionRepository_1 = require("../repositories/CareActionRepository");
const TaskRepository_1 = require("../repositories/TaskRepository");
const PlantRepository_1 = require("../repositories/PlantRepository");
const mongoose_1 = __importDefault(require("mongoose"));
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../config/redis"));
exports.aiAnalysisQueue = redis_1.default
    ? new bullmq_1.Queue('ai.analysis', { connection: redis_1.default })
    : null;
class AnalyticsService {
    constructor() {
        this.snapshotRepo = new AnalyticsSnapshotRepository_1.AnalyticsSnapshotRepository();
        this.careActionRepo = new CareActionRepository_1.CareActionRepository();
        this.taskRepo = new TaskRepository_1.TaskRepository();
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    async generateWeeklySnapshot(userId) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        const objectIdUser = new mongoose_1.default.Types.ObjectId(userId);
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
            user: objectIdUser,
            mostWateredPlant: mostWateredPlant,
            taskCompletionRate,
            periodStart: start,
            periodEnd: end
        });
        return snapshot;
    }
    async triggerAiAnalysis(userId) {
        // Add job to BullMQ queue
        await exports.aiAnalysisQueue?.add('analyzeGarden', { userId });
        return { status: 'queued', message: 'AI analysis has been queued' };
    }
}
exports.AnalyticsService = AnalyticsService;
