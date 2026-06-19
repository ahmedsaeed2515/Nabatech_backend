"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmToken = exports.getDashboardStats = exports.getUserDetails = exports.deleteUser = exports.updateUserRole = exports.changePassword = exports.updateProfile = exports.getCurrentUser = exports.getAllUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const message_model_1 = __importDefault(require("../models/message_model"));
const expert_model_1 = __importDefault(require("../models/expert_model"));
const comment_model_1 = __importDefault(require("../models/comment_model"));
const diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
// @desc    Get all users (Admin/Management only)
// @route   GET /api/users/
// @access  Private
const getAllUsers = async (req, res) => {
    try {
        const users = await user_model_1.default.find().select("-password");
        res.status(200).json({
            count: users.length,
            users
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
};
exports.getAllUsers = getAllUsers;
// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch profile", error });
    }
};
exports.getCurrentUser = getCurrentUser;
// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phoneNumber, selectedCountry, avatarUrl, preferences } = req.body;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (fullName !== undefined) {
            if (fullName.trim() === "") {
                return res.status(400).json({ message: "Name cannot be empty" });
            }
            user.name = fullName.trim();
        }
        if (phoneNumber !== undefined) {
            user.phoneNumber = phoneNumber.trim() === "" ? undefined : phoneNumber.trim();
        }
        if (selectedCountry !== undefined) {
            user.selectedCountry = selectedCountry.trim();
        }
        if (avatarUrl !== undefined) {
            user.avatarUrl = avatarUrl.trim();
        }
        if (preferences !== undefined) {
            if (!user.preferences) {
                user.preferences = { theme: 'system', language: 'en', notificationsEnabled: true };
            }
            if (preferences.theme !== undefined) {
                user.preferences.theme = preferences.theme;
            }
            if (preferences.language !== undefined) {
                user.preferences.language = preferences.language;
            }
            if (preferences.notificationsEnabled !== undefined) {
                user.preferences.notificationsEnabled = preferences.notificationsEnabled;
            }
        }
        await user.save();
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                avatarUrl: user.avatarUrl,
                selectedCountry: user.selectedCountry,
                preferences: user.preferences,
                createdAt: user.createdAt,
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Profile update failed", error });
    }
};
exports.updateProfile = updateProfile;
// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash || user.password || '');
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({
                message: "New password must be at least 6 characters and contain both letters and numbers"
            });
        }
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        // Increment tokenVersion to invalidate all previously issued access tokens
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    }
    catch (error) {
        res.status(500).json({ message: "Password change failed", error });
    }
};
exports.changePassword = changePassword;
// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await user_model_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.role = role;
        await user.save();
        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update user role", error });
    }
};
exports.updateUserRole = updateUserRole;
// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Cascade deletions
        await community_post_model_1.default.deleteMany({ author: user._id });
        await comment_model_1.default.deleteMany({ author: user._id });
        await my_plant_model_1.default.deleteMany({ user: user._id });
        await diary_entry_model_1.default.deleteMany({ user: user._id });
        await reminder_model_1.default.deleteMany({ user: user._id });
        await diagnosis_history_model_1.default.deleteMany({ user: user._id });
        await user_model_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete user", error });
    }
};
exports.deleteUser = deleteUser;
// @desc    Get detailed stats for a user (Admin only)
// @route   GET /api/users/:id/details
// @access  Private/Admin
const getUserDetails = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const [plantsCount, remindersCount, diagnosesCount, postsCount, diariesCount] = await Promise.all([
            my_plant_model_1.default.countDocuments({ user: user._id }),
            reminder_model_1.default.countDocuments({ user: user._id }),
            diagnosis_history_model_1.default.countDocuments({ user: user._id }),
            community_post_model_1.default.countDocuments({ author: user._id }),
            diary_entry_model_1.default.countDocuments({ user: user._id })
        ]);
        res.status(200).json({
            success: true,
            user,
            stats: {
                plants: plantsCount,
                reminders: remindersCount,
                diagnoses: diagnosesCount,
                posts: postsCount,
                diaries: diariesCount
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch user details", error });
    }
};
exports.getUserDetails = getUserDetails;
// @desc    Get dashboard metrics (Admin only)
// @route   GET /api/users/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await user_model_1.default.countDocuments();
        const totalDiagnoses = await diagnosis_history_model_1.default.countDocuments();
        const totalPlants = await my_plant_model_1.default.countDocuments();
        const totalReminders = await reminder_model_1.default.countDocuments();
        const totalPosts = await community_post_model_1.default.countDocuments();
        const totalProducts = await store_product_model_1.default.countDocuments();
        const totalMessages = await message_model_1.default.countDocuments();
        const totalExperts = await expert_model_1.default.countDocuments();
        // Diagnoses breakdown by severity
        const diagnosesBySeverity = await diagnosis_history_model_1.default.aggregate([
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);
        // Top diagnosed diseases
        const topDiseases = await diagnosis_history_model_1.default.aggregate([
            { $group: { _id: "$diseaseNameEn", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        // FIXED: Aggregate daily diagnoses for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // standard 7-day range including today
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const dailyDiagnoses = await diagnosis_history_model_1.default.aggregate([
            {
                $match: {
                    diagnosedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$diagnosedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        // FIXED: Calculate offline vs remote scan counts for the pie chart
        const totalOfflineScans = await diagnosis_history_model_1.default.countDocuments({ isOffline: true });
        const totalRemoteScans = await diagnosis_history_model_1.default.countDocuments({ isOffline: false });
        const activeReminders = await reminder_model_1.default.countDocuments({ enabled: true });
        res.status(200).json({
            success: true,
            totalUsers,
            totalDiagnoses,
            totalPosts,
            activeReminders,
            dailyDiagnoses: dailyDiagnoses.map((item) => ({
                date: item._id,
                count: item.count,
            })),
            topDiseases: topDiseases.map((item) => ({
                name: item._id || "Healthy / Unknown",
                count: item.count,
            })),
            offlineVsRemote: {
                offline: totalOfflineScans,
                remote: totalRemoteScans,
            },
            // Dual-compatibility layer to keep dashboard graphs working perfectly
            stats: {
                totalUsers,
                totalDiagnoses,
                totalPlants,
                totalReminders,
                totalPosts,
                totalProducts,
                totalMessages,
                totalExperts,
                diagnosesBySeverity,
                topDiseases,
                dailyDiagnoses,
                scanDistribution: [
                    { name: "Remote Scans", value: totalRemoteScans },
                    { name: "Offline Scans", value: totalOfflineScans },
                ],
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard stats", error });
    }
};
exports.getDashboardStats = getDashboardStats;
// @desc    Update FCM Device Token
// @route   PUT /api/users/fcm-token
// @access  Private
const updateFcmToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.fcmToken = token;
        await user.save();
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to update FCM token", error });
    }
};
exports.updateFcmToken = updateFcmToken;
