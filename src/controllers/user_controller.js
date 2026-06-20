"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmToken = exports.getDashboardStats = exports.getUserDetails = exports.deleteUser = exports.updateUserRole = exports.changePassword = exports.updateProfile = exports.getCurrentUser = exports.getAllUsers = void 0;
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var user_model_1 = __importDefault(require("../models/user_model"));
var community_post_model_1 = __importDefault(require("../models/community_post_model"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
var reminder_model_1 = __importDefault(require("../models/reminder_model"));
var comment_model_1 = __importDefault(require("../models/comment_model"));
var diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
// @desc    Get all users (Admin/Management only)
// @route   GET /api/users/
// @access  Private
var getAllUsers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, user_model_1.default.find().select("-password")];
            case 1:
                users = _a.sent();
                res.status(200).json({
                    count: users.length,
                    users: users
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error(error_1);
                res.status(500).json({
                    message: "Failed to fetch users"
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllUsers = getAllUsers;
// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
var getCurrentUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        try {
            user = req.user;
            if (!user) {
                return [2 /*return*/, res.status(401).json({ message: "Not authorized, user not found" })];
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
            res.status(500).json({ message: "Failed to fetch profile", error: error });
        }
        return [2 /*return*/];
    });
}); };
exports.getCurrentUser = getCurrentUser;
// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
var updateProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, fullName, phoneNumber, selectedCountry, avatarUrl, preferences, user, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                _a = req.body, fullName = _a.fullName, phoneNumber = _a.phoneNumber, selectedCountry = _a.selectedCountry, avatarUrl = _a.avatarUrl, preferences = _a.preferences;
                return [4 /*yield*/, user_model_1.default.findById(userId)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                if (fullName !== undefined) {
                    if (fullName.trim() === "") {
                        return [2 /*return*/, res.status(400).json({ message: "Name cannot be empty" })];
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
                return [4 /*yield*/, user.save()];
            case 2:
                _b.sent();
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
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                res.status(500).json({ message: "Profile update failed", error: error_2 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateProfile = updateProfile;
// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
var changePassword = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, currentPassword, newPassword, user, isMatch, _b, error_3;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 5, , 6]);
                userId = req.user.id;
                _a = req.body, currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                if (!currentPassword || !newPassword) {
                    return [2 /*return*/, res.status(400).json({ message: "Current and new password are required" })];
                }
                return [4 /*yield*/, user_model_1.default.findById(userId)];
            case 1:
                user = _d.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                return [4 /*yield*/, bcryptjs_1.default.compare(currentPassword, user.passwordHash || user.password || '')];
            case 2:
                isMatch = _d.sent();
                if (!isMatch) {
                    return [2 /*return*/, res.status(400).json({ message: "Current password is incorrect" })];
                }
                if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                    return [2 /*return*/, res.status(400).json({
                            message: "New password must be at least 6 characters and contain both letters and numbers"
                        })];
                }
                _b = user;
                return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, 10)];
            case 3:
                _b.passwordHash = _d.sent();
                // Increment tokenVersion to invalidate all previously issued access tokens
                user.tokenVersion = ((_c = user.tokenVersion) !== null && _c !== void 0 ? _c : 0) + 1;
                return [4 /*yield*/, user.save()];
            case 4:
                _d.sent();
                res.status(200).json({
                    success: true,
                    message: "Password updated successfully"
                });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _d.sent();
                res.status(500).json({ message: "Password change failed", error: error_3 });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.changePassword = changePassword;
// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
var updateUserRole = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var role, user, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                role = req.body.role;
                return [4 /*yield*/, user_model_1.default.findById(req.params.id)];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                user.role = role;
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
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
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                res.status(500).json({ message: "Failed to update user role", error: error_4 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateUserRole = updateUserRole;
// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
var deleteUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                return [4 /*yield*/, user_model_1.default.findById(req.params.id)];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                // Cascade deletions
                return [4 /*yield*/, community_post_model_1.default.deleteMany({ author: user._id })];
            case 2:
                // Cascade deletions
                _a.sent();
                return [4 /*yield*/, comment_model_1.default.deleteMany({ author: user._id })];
            case 3:
                _a.sent();
                return [4 /*yield*/, my_plant_model_1.default.deleteMany({ user: user._id })];
            case 4:
                _a.sent();
                return [4 /*yield*/, diary_entry_model_1.default.deleteMany({ user: user._id })];
            case 5:
                _a.sent();
                return [4 /*yield*/, reminder_model_1.default.deleteMany({ user: user._id })];
            case 6:
                _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.deleteMany({ user: user._id })];
            case 7:
                _a.sent();
                return [4 /*yield*/, user_model_1.default.findByIdAndDelete(req.params.id)];
            case 8:
                _a.sent();
                res.status(200).json({
                    success: true,
                    message: "User deleted successfully"
                });
                return [3 /*break*/, 10];
            case 9:
                error_5 = _a.sent();
                res.status(500).json({ message: "Failed to delete user", error: error_5 });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.deleteUser = deleteUser;
// @desc    Get detailed stats for a user (Admin only)
// @route   GET /api/users/:id/details
// @access  Private/Admin
var getUserDetails = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, plantsCount, remindersCount, diagnosesCount, postsCount, diariesCount, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, user_model_1.default.findById(req.params.id).select("-password")];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                return [4 /*yield*/, Promise.all([
                        my_plant_model_1.default.countDocuments({ user: user._id }),
                        reminder_model_1.default.countDocuments({ user: user._id }),
                        diagnosis_history_model_1.default.countDocuments({ user: user._id }),
                        community_post_model_1.default.countDocuments({ author: user._id }),
                        diary_entry_model_1.default.countDocuments({ user: user._id })
                    ])];
            case 2:
                _a = _b.sent(), plantsCount = _a[0], remindersCount = _a[1], diagnosesCount = _a[2], postsCount = _a[3], diariesCount = _a[4];
                res.status(200).json({
                    success: true,
                    user: user,
                    stats: {
                        plants: plantsCount,
                        reminders: remindersCount,
                        diagnoses: diagnosesCount,
                        posts: postsCount,
                        diaries: diariesCount
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                res.status(500).json({ message: "Failed to fetch user details", error: error_6 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUserDetails = getUserDetails;
// @desc    Get dashboard metrics (Admin only)
// @route   GET /api/users/dashboard-stats
// @access  Private/Admin
var getDashboardStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalUsers, totalDiagnoses, totalPosts, activeReminders, topDiseases, sevenDaysAgo, dailyDiagnoses, totalOfflineScans, totalRemoteScans, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                return [4 /*yield*/, user_model_1.default.countDocuments()];
            case 1:
                totalUsers = _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments()];
            case 2:
                totalDiagnoses = _a.sent();
                return [4 /*yield*/, community_post_model_1.default.countDocuments()];
            case 3:
                totalPosts = _a.sent();
                return [4 /*yield*/, reminder_model_1.default.countDocuments({ enabled: true })];
            case 4:
                activeReminders = _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.aggregate([
                        { $group: { _id: "$diseaseNameEn", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ])];
            case 5:
                topDiseases = _a.sent();
                sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // standard 7-day range including today
                sevenDaysAgo.setHours(0, 0, 0, 0);
                return [4 /*yield*/, diagnosis_history_model_1.default.aggregate([
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
                    ])];
            case 6:
                dailyDiagnoses = _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments({ isOffline: true })];
            case 7:
                totalOfflineScans = _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments({ isOffline: false })];
            case 8:
                totalRemoteScans = _a.sent();
                res.status(200).json({
                    success: true,
                    totalUsers: totalUsers,
                    totalDiagnoses: totalDiagnoses,
                    totalPosts: totalPosts,
                    activeReminders: activeReminders,
                    dailyDiagnoses: dailyDiagnoses.map(function (item) { return ({
                        date: item._id,
                        count: item.count,
                    }); }),
                    topDiseases: topDiseases.map(function (item) { return ({
                        name: item._id || "Healthy / Unknown",
                        count: item.count,
                    }); }),
                    offlineVsRemote: {
                        offline: totalOfflineScans,
                        remote: totalRemoteScans,
                    },
                });
                return [3 /*break*/, 10];
            case 9:
                error_7 = _a.sent();
                res.status(500).json({ message: "Failed to fetch dashboard stats", error: error_7 });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.getDashboardStats = getDashboardStats;
// @desc    Update FCM Device Token
// @route   PUT /api/users/fcm-token
// @access  Private
var updateFcmToken = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, token, user, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                token = req.body.token;
                if (!token) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Token is required" })];
                }
                return [4 /*yield*/, user_model_1.default.findById(userId)];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "User not found" })];
                }
                user.fcmToken = token;
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                res.status(200).json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to update FCM token", error: error_8 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateFcmToken = updateFcmToken;
