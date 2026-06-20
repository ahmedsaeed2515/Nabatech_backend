"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const TaskRepository_1 = require("../repositories/TaskRepository");
const CalendarEventRepository_1 = require("../repositories/CalendarEventRepository");
const task_model_1 = require("../models/task_model");
class TaskService {
    constructor() {
        this.taskRepo = new TaskRepository_1.TaskRepository();
        this.calendarEventRepo = new CalendarEventRepository_1.CalendarEventRepository();
    }
    async getDailyTasks(userId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const tasks = await this.taskRepo.findByDate(userId, startOfDay, endOfDay);
        return tasks;
    }
    async completeTask(taskId, userId) {
        const task = await this.taskRepo.findOne({ _id: taskId, user: userId });
        if (!task)
            throw new Error('Task not found');
        task.status = task_model_1.TaskStatus.COMPLETED;
        await task.save();
        return task;
    }
    async createTask(userId, title, dueDate, plantId) {
        return this.taskRepo.create({
            user: userId,
            title,
            dueDate,
            plant: plantId,
            status: task_model_1.TaskStatus.PENDING
        });
    }
    async updateTask(taskId, userId, data) {
        const task = await this.taskRepo.findOne({ _id: taskId, user: userId });
        if (!task)
            return null;
        return this.taskRepo.update(taskId, data);
    }
    async deleteTask(taskId, userId) {
        const task = await this.taskRepo.findOne({ _id: taskId, user: userId });
        if (!task)
            return false;
        await this.taskRepo.hardDelete(taskId);
        return true;
    }
}
exports.TaskService = TaskService;
