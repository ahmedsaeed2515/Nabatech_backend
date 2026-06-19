import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User, { UserRole } from "../models/user_model";
import CommunityPost from "../models/community_post_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import MyPlant from "../models/my_plant_model";
import Reminder from "../models/reminder_model";
import StoreProduct from "../models/store_product_model";
import Message from "../models/message_model";
import Expert from "../models/expert_model";
import Comment from "../models/comment_model";
import DiaryEntry from "../models/diary_entry_model";
// @desc    Get all users (Admin/Management only)
// @route   GET /api/users/
// @access  Private
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch users"
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error });
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { fullName, phoneNumber, selectedCountry, avatarUrl, preferences } = req.body;

    const user = await User.findById(userId);
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
  } catch (error) {
    res.status(500).json({ message: "Profile update failed", error });
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || user.password || '');
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        message: "New password must be at least 6 characters and contain both letters and numbers"
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // Increment tokenVersion to invalidate all previously issued access tokens
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Password change failed", error });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role as UserRole;
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
  } catch (error) {
    res.status(500).json({ message: "Failed to update user role", error });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cascade deletions
    await CommunityPost.deleteMany({ author: user._id });
    await Comment.deleteMany({ author: user._id });
    await MyPlant.deleteMany({ user: user._id });
    await DiaryEntry.deleteMany({ user: user._id });
    await Reminder.deleteMany({ user: user._id });
    await DiagnosisHistory.deleteMany({ user: user._id });

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error });
  }
};

// @desc    Get detailed stats for a user (Admin only)
// @route   GET /api/users/:id/details
// @access  Private/Admin
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [plantsCount, remindersCount, diagnosesCount, postsCount, diariesCount] = await Promise.all([
      MyPlant.countDocuments({ user: user._id }),
      Reminder.countDocuments({ user: user._id }),
      DiagnosisHistory.countDocuments({ user: user._id }),
      CommunityPost.countDocuments({ author: user._id }),
      DiaryEntry.countDocuments({ user: user._id })
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
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user details", error });
  }
};

// @desc    Get dashboard metrics (Admin only)
// @route   GET /api/users/dashboard-stats
// @access  Private/Admin
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDiagnoses = await DiagnosisHistory.countDocuments();
    const totalPlants = await MyPlant.countDocuments();
    const totalReminders = await Reminder.countDocuments();
    const totalPosts = await CommunityPost.countDocuments();
    const totalProducts = await StoreProduct.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalExperts = await Expert.countDocuments();

    // Diagnoses breakdown by severity
    const diagnosesBySeverity = await DiagnosisHistory.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]);

    // Top diagnosed diseases
    const topDiseases = await DiagnosisHistory.aggregate([
      { $group: { _id: "$diseaseNameEn", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // FIXED: Aggregate daily diagnoses for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // standard 7-day range including today
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyDiagnoses = await DiagnosisHistory.aggregate([
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
    const totalOfflineScans = await DiagnosisHistory.countDocuments({ isOffline: true });
    const totalRemoteScans = await DiagnosisHistory.countDocuments({ isOffline: false });
    const activeReminders = await Reminder.countDocuments({ enabled: true });

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
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error });
  }
};

// @desc    Update FCM Device Token
// @route   PUT /api/users/fcm-token
// @access  Private
export const updateFcmToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.fcmToken = token;
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update FCM token", error });
  }
};
