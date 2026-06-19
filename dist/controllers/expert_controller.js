"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyExpertProfile = exports.getExpertProfile = void 0;
const expert_profile_model_1 = __importDefault(require("../models/expert_profile_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const app_error_1 = require("../utils/app_error");
// @desc    Get expert profile by userId
// @route   GET /api/experts/:id
// @access  Private
const getExpertProfile = async (req, res, next) => {
    try {
        const expertId = req.params.id;
        const user = await user_model_1.default.findById(expertId).select('name email role avatarUrl createdAt');
        if (!user) {
            return next(new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'User not found' }));
        }
        if (user.role !== 'expert') {
            return next(new app_error_1.AppError({ code: 'INVALID_ROLE', statusCode: 400, message: 'User is not an expert' }));
        }
        const profile = await expert_profile_model_1.default.findOne({ userId: expertId });
        const recentPosts = await community_post_model_1.default.find({ author: expertId, status: 'visible' })
            .sort({ createdAt: -1 })
            .limit(5);
        res.status(200).json({
            success: true,
            data: {
                expert: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    joinedAt: user.createdAt,
                    role: user.role,
                },
                profile: profile || null,
                recentPosts: recentPosts.map(p => ({
                    id: p._id,
                    title: p.title,
                    content: p.content,
                    plantTag: p.plantTag,
                    commentsCount: p.commentsCount,
                    likesCount: p.likes,
                    createdAt: p.createdAt,
                })),
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpertProfile = getExpertProfile;
// @desc    Update current expert's profile
// @route   PUT /api/experts/me/profile
// @access  Private (Expert only)
const updateMyExpertProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bio, specialization, yearsExperience } = req.body;
        // Verify role
        const user = await user_model_1.default.findById(userId);
        if (!user || user.role !== 'expert') {
            return next(new app_error_1.AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Only experts can have profiles' }));
        }
        const profile = await expert_profile_model_1.default.findOneAndUpdate({ userId }, { $set: { bio, specialization, yearsExperience } }, { new: true, upsert: true, runValidators: true });
        res.status(200).json({
            success: true,
            data: { profile }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMyExpertProfile = updateMyExpertProfile;
