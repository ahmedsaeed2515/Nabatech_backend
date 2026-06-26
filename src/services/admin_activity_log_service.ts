import AdminActivityLog from '../models/admin_activity_log_model';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export class AdminActivityLogService {
  static async logAction(
    adminId: string,
    action: string,
    targetId: string,
    targetModel: 'CommunityPost' | 'Comment' | 'User',
    details?: any
  ): Promise<void> {
    try {
      await AdminActivityLog.create({
        adminId: new mongoose.Types.ObjectId(adminId),
        action,
        targetId: new mongoose.Types.ObjectId(targetId),
        targetModel,
        details,
      });
    } catch (error) {
      logger.error('Failed to log admin activity', { error, adminId, action, targetId });
    }
  }

  static async getLogs(filters: any = {}, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      const logs = await AdminActivityLog.find(filters)
        .populate('adminId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await AdminActivityLog.countDocuments(filters);
      
      return { logs, total, pages: Math.ceil(total / limit) };
    } catch (error) {
      logger.error('Failed to get admin activity logs', { error });
      throw error;
    }
  }
}


