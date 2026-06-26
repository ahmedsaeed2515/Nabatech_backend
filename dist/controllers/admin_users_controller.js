"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateUser = exports.bulkAction = exports.restoreUser = exports.softDeleteUser = exports.updateUserStatus = exports.updateUserRole = exports.getUserById = exports.updateUserModeration = exports.getUsers = void 0;
const user_model_1 = __importStar(require("../models/user_model"));
const admin_audit_log_model_1 = __importDefault(require("../models/admin_audit_log_model"));
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const comment_v2_model_1 = __importDefault(require("../models/comment_v2_model"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Helper to log admin actions
const logAction = async (adminId, action, targetUserId, details, targetUsers) => {
    await admin_audit_log_model_1.default.create({
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
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { search, role, status, expertStatus, showDeleted } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (role && role !== 'all')
            query.role = role;
        if (status && status !== 'all')
            query.status = status;
        if (expertStatus && expertStatus !== 'all')
            query.expertStatus = expertStatus;
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
        let userQuery = user_model_1.default.find(query);
        if (showDeleted === 'true') {
            // Bypass the hook by using aggregate
            const total = await user_model_1.default.collection.countDocuments(query);
            const users = await user_model_1.default.collection.find(query)
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
        const total = await user_model_1.default.countDocuments(query);
        const users = await user_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.status(200).json({
            users,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch users', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUsers = getUsers;
const updateUserModeration = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;
        const adminId = req.user.id;
        const user = await user_model_1.default.findById(id);
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });
        let updateData = {};
        switch (action) {
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
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(adminId, `USER_${action.toUpperCase()}`, user.id, "User", updateData);
        res.status(200).json({ success: true, message: `User ${action} successful`, data: user });
    }
    catch (error) {
        logger_1.logger.error('Failed to update user moderation', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUserModeration = updateUserModeration;
// @desc    Get user details & stats
// @route   GET /api/admin/users/:id
// @access  Private (Admin/SuperAdmin)
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        // Attempt aggregate to bypass soft-delete filter in case they view a deleted user
        const userObj = await user_model_1.default.collection.findOne({ _id: new mongoose_1.default.Types.ObjectId(userId) });
        if (!userObj) {
            return res.status(404).json({ message: "User not found" });
        }
        const [plantsCount, diagnosesCount, postsCount, commentsCount] = await Promise.all([
            my_plant_model_1.default.countDocuments({ userId }),
            diagnosis_history_model_1.default.countDocuments({ user: userId }),
            community_post_model_1.default.countDocuments({ author: userId }),
            comment_v2_model_1.default.countDocuments({ author: userId })
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
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch user details", error });
    }
};
exports.getUserById = getUserById;
// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin/SuperAdmin)
const updateUserRole = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body;
        const adminId = req.user.id;
        const adminRole = req.user.role;
        if (!Object.values(user_model_1.UserRole).includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const targetUser = await user_model_1.default.collection.findOne({ _id: new mongoose_1.default.Types.ObjectId(targetUserId) });
        if (!targetUser)
            return res.status(404).json({ message: "User not found" });
        // SuperAdmin protection: Admins cannot promote/demote to/from Admin or SuperAdmin
        if (adminRole !== user_model_1.UserRole.SUPER_ADMIN) {
            if (role === user_model_1.UserRole.ADMIN || role === user_model_1.UserRole.SUPER_ADMIN) {
                return res.status(403).json({ message: "Only Super Admins can assign Admin roles" });
            }
            if (targetUser.role === user_model_1.UserRole.ADMIN || targetUser.role === user_model_1.UserRole.SUPER_ADMIN) {
                return res.status(403).json({ message: "Admins cannot modify other Admins" });
            }
        }
        await user_model_1.default.collection.updateOne({ _id: new mongoose_1.default.Types.ObjectId(targetUserId) }, { $set: { role, updatedAt: new Date() } });
        await logAction(adminId, 'UPDATE_ROLE', targetUserId, { oldRole: targetUser.role, newRole: role });
        res.status(200).json({ message: "Role updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update role", error });
    }
};
exports.updateUserRole = updateUserRole;
// @desc    Update user status / expert status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin/SuperAdmin)
const updateUserStatus = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const { status, expertStatus } = req.body;
        const adminId = req.user.id;
        const updates = { updatedAt: new Date() };
        if (status)
            updates.status = status;
        if (expertStatus) {
            updates.expertStatus = expertStatus;
            if (expertStatus === user_model_1.ExpertStatus.APPROVED) {
                updates.role = user_model_1.UserRole.EXPERT;
            }
            else if (expertStatus === user_model_1.ExpertStatus.REJECTED && !status) { // if no status change requested
                // demote if they were expert? Only if required.
            }
        }
        const targetUser = await user_model_1.default.collection.findOne({ _id: new mongoose_1.default.Types.ObjectId(targetUserId) });
        if (!targetUser)
            return res.status(404).json({ message: "User not found" });
        await user_model_1.default.collection.updateOne({ _id: new mongoose_1.default.Types.ObjectId(targetUserId) }, { $set: updates });
        await logAction(adminId, 'UPDATE_STATUS', targetUserId, updates);
        res.status(200).json({ message: "Status updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update status", error });
    }
};
exports.updateUserStatus = updateUserStatus;
// @desc    Soft Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin/SuperAdmin)
const softDeleteUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const adminId = req.user.id;
        await user_model_1.default.collection.updateOne({ _id: new mongoose_1.default.Types.ObjectId(targetUserId) }, { $set: { isDeleted: true, deletedBy: new mongoose_1.default.Types.ObjectId(adminId), deletedAt: new Date() } });
        await logAction(adminId, 'SOFT_DELETE_USER', targetUserId, {});
        res.status(200).json({ message: "User soft deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete user", error });
    }
};
exports.softDeleteUser = softDeleteUser;
// @desc    Restore User
// @route   POST /api/admin/users/:id/restore
// @access  Private (Admin/SuperAdmin)
const restoreUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const adminId = req.user.id;
        await user_model_1.default.collection.updateOne({ _id: new mongoose_1.default.Types.ObjectId(targetUserId) }, { $set: { isDeleted: false, deletedBy: null, deletedAt: null } });
        await logAction(adminId, 'RESTORE_USER', targetUserId, {});
        res.status(200).json({ message: "User restored successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to restore user", error });
    }
};
exports.restoreUser = restoreUser;
// @desc    Bulk Actions
// @route   POST /api/admin/users/bulk-action
// @access  Private (Admin/SuperAdmin)
const bulkAction = async (req, res) => {
    try {
        const { action, userIds, payload } = req.body;
        const adminId = req.user.id;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "No users selected" });
        }
        const objectIds = userIds.map(id => new mongoose_1.default.Types.ObjectId(id));
        switch (action) {
            case 'SUSPEND':
                await user_model_1.default.collection.updateMany({ _id: { $in: objectIds } }, { $set: { status: 'disabled' } });
                break;
            case 'ACTIVATE':
                await user_model_1.default.collection.updateMany({ _id: { $in: objectIds } }, { $set: { status: 'active' } });
                break;
            case 'PROMOTE_EXPERT':
                await user_model_1.default.collection.updateMany({ _id: { $in: objectIds } }, { $set: { role: user_model_1.UserRole.EXPERT, expertStatus: user_model_1.ExpertStatus.APPROVED } });
                break;
            case 'DEMOTE_USER':
                await user_model_1.default.collection.updateMany({ _id: { $in: objectIds } }, { $set: { role: user_model_1.UserRole.USER } });
                break;
            case 'SOFT_DELETE':
                await user_model_1.default.collection.updateMany({ _id: { $in: objectIds } }, { $set: { isDeleted: true, deletedBy: new mongoose_1.default.Types.ObjectId(adminId), deletedAt: new Date() } });
                break;
            default:
                return res.status(400).json({ message: "Invalid bulk action" });
        }
        await logAction(adminId, `BULK_${action}`, null, payload, userIds);
        res.status(200).json({ message: "Bulk action executed successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to execute bulk action", error });
    }
};
exports.bulkAction = bulkAction;
const adminCreateUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const adminId = req.user.id;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" });
        }
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = new user_model_1.default({
            name,
            email,
            passwordHash: hashedPassword,
            role: role || 'user',
            isEmailVerified: true // Admin created users are automatically verified
        });
        await newUser.save();
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(adminId, "CREATE_USER", newUser.id, "User", { email, role: newUser.role });
        res.status(201).json({ success: true, data: newUser, message: "User created successfully" });
    }
    catch (error) {
        logger_1.logger.error('Failed to create user as admin', { error });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.adminCreateUser = adminCreateUser;
