import { Request, Response } from "express";
import User, { UserRole, ExpertStatus } from "../models/user_model";
import AdminAuditLog from "../models/admin_audit_log_model";
import MyPlant from "../models/my_plant_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import CommunityPost from "../models/community_post_model";
import CommentV2 from "../models/comment_v2_model";
import mongoose from "mongoose";
import { logger } from "../utils/logger";
import bcrypt from "bcryptjs";

// Helper to log admin actions
const logAction = async (adminId: string, action: string, targetUserId: string | null, details: any, targetUsers?: string[]) => {
  await AdminAuditLog.create({
    admin: adminId,
    action,
    targetUser: targetUserId,
    targetUsers,
    details,
  });
};

// @desc    Get all users with advanced filtering
// @route   GET /api/admin/users
// @access  Private (Admin/SuperAdmin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { search, role, status, expertStatus, showDeleted } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    if (expertStatus && expertStatus !== 'all') query.expertStatus = expertStatus;
    
    // Handle soft deletes bypass
    if (showDeleted === 'true') {
      // Because there's a global pre-find hook for `isDeleted: { $ne: true }`,
      // we need to bypass it. Mongoose doesn't have an easy way to bypass pre hooks 
      // without using lean or a separate model. Actually, the best way in mongoose
      // is to just delete the query condition. Wait, the pre-hook automatically adds it.
      // We will override it manually.
      query.isDeleted = { $in: [true, false, null] };
    }

    // Workaround for global pre-hook if showDeleted is true:
    // If showDeleted is not requested, the hook will handle hiding deleted users.
    let userQuery = User.find(query);
    if (showDeleted === 'true') {
      // Bypass the hook by using aggregate
      const total = await User.collection.countDocuments(query);
      const users = await User.collection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      return res.status(200).json({
        users,
        page,
        pages: Math.ceil(total / limit),
        total
      });
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    logger.error('Failed to fetch users', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserModeration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const adminId = (req as any).user.id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let updateData: any = {};
    switch(action) {
      case "suspend":
        user.isSuspended = true;
        user.suspensionReason = reason;
        updateData = { isSuspended: true, suspensionReason: reason };
        break;
      case "unsuspend":
        user.isSuspended = false;
        user.suspensionReason = undefined;
        updateData = { isSuspended: false };
        break;
      case "ban":
        user.isBanned = true;
        user.banReason = reason;
        updateData = { isBanned: true, banReason: reason };
        break;
      case "unban":
        user.isBanned = false;
        user.banReason = undefined;
        updateData = { isBanned: false };
        break;
      case "mute":
        user.isMuted = true;
        updateData = { isMuted: true };
        break;
      case "unmute":
        user.isMuted = false;
        updateData = { isMuted: false };
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid action" });
    }

    await user.save();

    const AdminActivityLogService = (await import('../services/admin_activity_log_service')).AdminActivityLogService;
    await AdminActivityLogService.logAction(adminId, `USER_${action.toUpperCase()}`, user.id, "User", updateData);

    res.status(200).json({ success: true, message: `User ${action} successful`, data: user });
  } catch (error) {
    logger.error('Failed to update user moderation', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Get user details & stats
// @route   GET /api/admin/users/:id
// @access  Private (Admin/SuperAdmin)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    // Attempt aggregate to bypass soft-delete filter in case they view a deleted user
    const userObj = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!userObj) {
      return res.status(404).json({ message: "User not found" });
    }

    const [plantsCount, diagnosesCount, postsCount, commentsCount] = await Promise.all([
      MyPlant.countDocuments({ userId }),
      DiagnosisHistory.countDocuments({ user: userId }),
      CommunityPost.countDocuments({ author: userId }),
      CommentV2.countDocuments({ author: userId })
    ]);

    res.status(200).json({
      user: userObj,
      stats: {
        plants: plantsCount,
        diagnoses: diagnosesCount,
        posts: postsCount,
        comments: commentsCount,
        notifications: 0 // Will handle later if NotificationModel is known
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user details", error });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin/SuperAdmin)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id as string;
    const { role } = req.body;
    const adminId = (req as any).user.id as string;
    const adminRole = (req as any).user.role;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const targetUser = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(targetUserId) });
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // SuperAdmin protection: Admins cannot promote/demote to/from Admin or SuperAdmin
    if (adminRole !== UserRole.SUPER_ADMIN) {
      if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: "Only Super Admins can assign Admin roles" });
      }
      if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: "Admins cannot modify other Admins" });
      }
    }

    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(targetUserId) },
      { $set: { role, updatedAt: new Date() } }
    );

    await logAction(adminId, 'UPDATE_ROLE', targetUserId, { oldRole: targetUser.role, newRole: role });

    res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update role", error });
  }
};

// @desc    Update user status / expert status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin/SuperAdmin)
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id as string;
    const { status, expertStatus } = req.body;
    const adminId = (req as any).user.id as string;

    const updates: any = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (expertStatus) {
      updates.expertStatus = expertStatus;
      if (expertStatus === ExpertStatus.APPROVED) {
        updates.role = UserRole.EXPERT;
      } else if (expertStatus === ExpertStatus.REJECTED && !status) { // if no status change requested
        // demote if they were expert? Only if required.
      }
    }

    const targetUser = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(targetUserId) });
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(targetUserId) },
      { $set: updates }
    );

    await logAction(adminId, 'UPDATE_STATUS', targetUserId, updates);

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error });
  }
};

// @desc    Soft Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin/SuperAdmin)
export const softDeleteUser = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id as string;
    const adminId = (req as any).user.id as string;

    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(targetUserId) },
      { $set: { isDeleted: true, deletedBy: new mongoose.Types.ObjectId(adminId), deletedAt: new Date() } }
    );

    await logAction(adminId, 'SOFT_DELETE_USER', targetUserId, {});

    res.status(200).json({ message: "User soft deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error });
  }
};

// @desc    Restore User
// @route   POST /api/admin/users/:id/restore
// @access  Private (Admin/SuperAdmin)
export const restoreUser = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id as string;
    const adminId = (req as any).user.id as string;

    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(targetUserId) },
      { $set: { isDeleted: false, deletedBy: null, deletedAt: null } }
    );

    await logAction(adminId, 'RESTORE_USER', targetUserId, {});

    res.status(200).json({ message: "User restored successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore user", error });
  }
};

// @desc    Bulk Actions
// @route   POST /api/admin/users/bulk-action
// @access  Private (Admin/SuperAdmin)
export const bulkAction = async (req: Request, res: Response) => {
  try {
    const { action, userIds, payload } = req.body;
    const adminId = (req as any).user.id as string;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No users selected" });
    }

    const objectIds = userIds.map(id => new mongoose.Types.ObjectId(id));

    switch (action) {
      case 'SUSPEND':
        await User.collection.updateMany({ _id: { $in: objectIds } }, { $set: { status: 'disabled' } });
        break;
      case 'ACTIVATE':
        await User.collection.updateMany({ _id: { $in: objectIds } }, { $set: { status: 'active' } });
        break;
      case 'PROMOTE_EXPERT':
        await User.collection.updateMany({ _id: { $in: objectIds } }, { $set: { role: UserRole.EXPERT, expertStatus: ExpertStatus.APPROVED } });
        break;
      case 'DEMOTE_USER':
        await User.collection.updateMany({ _id: { $in: objectIds } }, { $set: { role: UserRole.USER } });
        break;
      case 'SOFT_DELETE':
        await User.collection.updateMany({ _id: { $in: objectIds } }, { $set: { isDeleted: true, deletedBy: new mongoose.Types.ObjectId(adminId), deletedAt: new Date() } });
        break;
      default:
        return res.status(400).json({ message: "Invalid bulk action" });
    }

    await logAction(adminId, `BULK_${action}`, null, payload, userIds);

    res.status(200).json({ message: "Bulk action executed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to execute bulk action", error });
  }
};

export const adminCreateUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const adminId = (req as any).user.id;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      passwordHash: hashedPassword,
      role: role || 'user',
      isEmailVerified: true // Admin created users are automatically verified
    });

    await newUser.save();

    const AdminActivityLogService = (await import('../services/admin_activity_log_service')).AdminActivityLogService;
    await AdminActivityLogService.logAction(adminId, "CREATE_USER", newUser.id, "User", { email, role: newUser.role });

    res.status(201).json({ success: true, data: newUser, message: "User created successfully" });
  } catch (error) {
    logger.error('Failed to create user as admin', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



