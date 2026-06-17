"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const TaskService_1 = require("../services/TaskService");
const v2_1 = require("../validation/v2");
class TaskController {
    constructor() {
        this.getDailyTasks = async (req, res) => {
            try {
                const parsed = v2_1.dailyTasksSchema.parse(req.query);
                const userId = req.user._id || req.user.userId;
                const tasks = await this.taskService.getDailyTasks(userId, new Date(parsed.date));
                res.status(200).json({ status: 'success', data: tasks });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.completeTask = async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user._id || req.user.userId;
                const task = await this.taskService.completeTask(id, userId);
                res.status(200).json({ status: 'success', data: task });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.taskService = new TaskService_1.TaskService();
    }
}
exports.TaskController = TaskController;
