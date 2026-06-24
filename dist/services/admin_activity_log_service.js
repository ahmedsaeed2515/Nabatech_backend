"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminActivityLogService = void 0;
const admin_activity_log_model_1 = __importDefault(require("../models/admin_activity_log_model"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
class AdminActivityLogService {
    static async logAction(adminId, action, targetId, targetModel, details) {
        try {
            await admin_activity_log_model_1.default.create({
                adminId: new mongoose_1.default.Types.ObjectId(adminId),
                action,
                targetId: new mongoose_1.default.Types.ObjectId(targetId),
                targetModel,
                details,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log admin activity', { error, adminId, action, targetId });
        }
    }
    static async getLogs(filters = {}, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const logs = await admin_activity_log_model_1.default.find(filters)
                .populate('adminId', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await admin_activity_log_model_1.default.countDocuments(filters);
            return { logs, total, pages: Math.ceil(total / limit) };
        }
        catch (error) {
            logger_1.logger.error('Failed to get admin activity logs', { error });
            throw error;
        }
    }
}
exports.AdminActivityLogService = AdminActivityLogService;
