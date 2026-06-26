"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFollowing = exports.getFollowers = exports.unfollowUser = exports.followUser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const follow_model_1 = __importDefault(require("../models/follow_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const logger_1 = require("../utils/logger");
const NotificationService_1 = require("../services/NotificationService");
const community_audit_service_1 = require("../services/community_audit_service");
const followUser = async (req, res) => {
    try {
        const followerId = req.user?.userId;
        const followingId = req.params.userId;
        if (!followerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (followerId === followingId) {
            return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
        }
        // Check if the user to follow exists
        const userToFollow = await user_model_1.default.findById(followingId);
        if (!userToFollow) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Create follow relationship
        const follow = new follow_model_1.default({
            follower: new mongoose_1.default.Types.ObjectId(followerId),
            following: new mongoose_1.default.Types.ObjectId(followingId),
        });
        await follow.save();
        await community_audit_service_1.CommunityAuditService.logAction(followerId, 'FOLLOW_USER', 'User', followingId);
        logger_1.logger.info('User followed another user', {
            event: 'community_feed_and_moderation.follow_user',
            actorId: followerId,
            targetId: followingId,
        });
        // Fire notification
        NotificationService_1.NotificationService.sendNotification({
            userId: followingId,
            actorId: followerId,
            type: 'FOLLOW_USER',
            entityId: followerId,
            entityType: 'User',
            title: 'New Follower',
            message: `${req.user?.name || 'Someone'} started following you.`
        }).catch(e => logger_1.logger.error('Error sending follow notification', { error: e }));
        res.status(201).json({ success: true, message: 'Successfully followed user' });
    }
    catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            return res.status(400).json({ success: false, message: 'Already following this user' });
        }
        logger_1.logger.error('Failed to follow user', { event: 'community_feed_and_moderation.follow_user.error', error });
        res.status(500).json({ success: false, message: 'Failed to follow user', error: error.message });
    }
};
exports.followUser = followUser;
const unfollowUser = async (req, res) => {
    try {
        const followerId = req.user?.userId || req.user?.id;
        const followingId = req.params.userId;
        if (!followerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const result = await follow_model_1.default.findOneAndDelete({
            follower: new mongoose_1.default.Types.ObjectId(followerId),
            following: new mongoose_1.default.Types.ObjectId(followingId),
        });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Follow relationship not found' });
        }
        await community_audit_service_1.CommunityAuditService.logAction(followerId, 'UNFOLLOW_USER', 'User', followingId);
        logger_1.logger.info('User unfollowed another user', {
            event: 'community_feed_and_moderation.unfollow_user',
            actorId: followerId,
            targetId: followingId,
        });
        res.status(200).json({ success: true, message: 'Successfully unfollowed user' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to unfollow user', error: error.message });
    }
};
exports.unfollowUser = unfollowUser;
const getFollowers = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const followers = await follow_model_1.default.find({ following: new mongoose_1.default.Types.ObjectId(userId) })
            .populate('follower', 'name avatarUrl role')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await follow_model_1.default.countDocuments({ following: new mongoose_1.default.Types.ObjectId(userId) });
        res.status(200).json({
            success: true,
            data: followers.map(f => f.follower),
            pagination: { total, page, pages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get followers', error: error.message });
    }
};
exports.getFollowers = getFollowers;
const getFollowing = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const following = await follow_model_1.default.find({ follower: new mongoose_1.default.Types.ObjectId(userId) })
            .populate('following', 'name avatarUrl role')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await follow_model_1.default.countDocuments({ follower: new mongoose_1.default.Types.ObjectId(userId) });
        res.status(200).json({
            success: true,
            data: following.map(f => f.following),
            pagination: { total, page, pages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get following', error: error.message });
    }
};
exports.getFollowing = getFollowing;
