"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const task_model_1 = __importDefault(require("../models/task_model"));
class TaskRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(task_model_1.default);
    }
    async findByDate(userId, dateStart, dateEnd) {
        return this.model.find({
            dueDate: { $gte: dateStart, $lt: dateEnd }
        }).where('user').equals(userId).populate('plant').exec();
    }
    async findPendingByDate(userId, dateStart, dateEnd) {
        return this.model.find({
            status: 'PENDING',
            dueDate: { $gte: dateStart, $lt: dateEnd }
        }).where('user').equals(userId).exec();
    }
    async checkPendingTask(plantId, dateStart) {
        const tasks = await this.model.find({
            plant: plantId,
            status: 'PENDING',
            dueDate: { $gte: dateStart }
        }).exec();
        return tasks.length > 0;
    }
    async findPendingForToday(dateStart, dateEnd) {
        return this.model.find({
            status: 'PENDING',
            dueDate: { $gte: dateStart, $lte: dateEnd }
        }).exec();
    }
    async aggregateTasks(pipeline) {
        return this.model.aggregate(pipeline).exec();
    }
}
exports.TaskRepository = TaskRepository;
