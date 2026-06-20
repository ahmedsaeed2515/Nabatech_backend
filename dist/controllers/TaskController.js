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
        this.createTask = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { title, dueDate, plantId } = req.body;
                const task = await this.taskService.createTask(userId, title, new Date(dueDate), plantId);
                res.status(201).json({ status: 'success', data: task });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updateTask = async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user._id || req.user.userId;
                const data = req.body;
                const task = await this.taskService.updateTask(id, userId, data);
                if (!task) {
                    return res.status(404).json({ status: 'error', message: 'Task not found' });
                }
                res.status(200).json({ status: 'success', data: task });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deleteTask = async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user._id || req.user.userId;
                const success = await this.taskService.deleteTask(id, userId);
                if (!success) {
                    return res.status(404).json({ status: 'error', message: 'Task not found' });
                }
                res.status(200).json({ status: 'success', message: 'Task deleted' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.taskService = new TaskService_1.TaskService();
    }
}
exports.TaskController = TaskController;
