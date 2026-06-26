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
exports.getAdminLogs = exports.adminUpdatePost = exports.restoreAdminCommunityComment = exports.deleteAdminCommunityComment = exports.restoreAdminCommunityPost = exports.deleteAdminCommunityPost = exports.getCommunityReputationStats = exports.adminUpdateComment = exports.adminModerateComment = exports.adminGetComments = exports.adminResolvePost = exports.adminModeratePost = exports.adminGetPosts = exports.getCommunityAnalytics = void 0;
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const comment_model_1 = __importDefault(require("../models/comment_model"));
const logger_1 = require("../utils/logger");
const community_report_model_1 = __importDefault(require("../models/community_report_model"));
const user_reputation_model_1 = __importDefault(require("../models/user_reputation_model"));
const follow_model_1 = __importDefault(require("../models/follow_model"));
const saved_post_model_1 = __importDefault(require("../models/saved_post_model"));
const community_audit_model_1 = __importDefault(require("../models/community_audit_model"));
const getCommunityAnalytics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [topPostToday, topAuthor, mostDiscussed, mostReported, postsPerDay, commentsPerDay, totalFollowers, totalSavedPosts, totalActivities, followersPerDay, savesPerDay, activitiesPerDay] = await Promise.all([
            // Top post today (most likes)
            community_post_model_1.default.findOne({ createdAt: { $gte: today }, status: 'visible' }).sort({ likes: -1 }).populate('author', 'name'),
            // Top author (most posts)
            community_post_model_1.default.aggregate([
                { $match: { status: 'visible' } },
                { $group: { _id: "$authorName", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]),
            // Most discussed (most comments)
            community_post_model_1.default.findOne({ status: 'visible' }).sort({ commentsCount: -1 }).populate('author', 'name'),
            // Most reported
            community_report_model_1.default.aggregate([
                { $match: { entityModel: 'CommunityPost' } },
                { $group: { _id: "$reportedEntityId", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]),
            // Posts per day
            community_post_model_1.default.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Comments per day
            comment_model_1.default.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Total Followers
            follow_model_1.default.countDocuments(),
            // Total Saved Posts
            saved_post_model_1.default.countDocuments(),
            // Total Activities
            community_audit_model_1.default.countDocuments(),
            // Followers per day
            follow_model_1.default.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Saves per day
            saved_post_model_1.default.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Activities per day
            community_audit_model_1.default.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);
        let mostReportedPostDetails = null;
        if (mostReported.length > 0 && mostReported[0]._id) {
            mostReportedPostDetails = await community_post_model_1.default.findById(mostReported[0]._id).populate('author', 'name');
        }
        res.status(200).json({
            success: true,
            data: {
                topPostToday: topPostToday ? { title: topPostToday.title, likes: topPostToday.likes, author: topPostToday.authorName } : null,
                topAuthor: topAuthor.length > 0 ? { name: topAuthor[0]._id, posts: topAuthor[0].count } : null,
                mostDiscussedPost: mostDiscussed ? { title: mostDiscussed.title, comments: mostDiscussed.commentsCount, author: mostDiscussed.authorName } : null,
                mostReportedPost: mostReportedPostDetails ? { title: mostReportedPostDetails.title, reports: mostReported[0].count, author: mostReportedPostDetails.authorName } : null,
                totalFollowers,
                totalSavedPosts,
                totalActivities,
                charts: {
                    postsPerDay: postsPerDay.map(p => ({ date: p._id, count: p.count })),
                    commentsPerDay: commentsPerDay.map(c => ({ date: c._id, count: c.count })),
                    followersPerDay: followersPerDay.map(f => ({ date: f._id, count: f.count })),
                    savesPerDay: savesPerDay.map(s => ({ date: s._id, count: s.count })),
                    activitiesPerDay: activitiesPerDay.map(a => ({ date: a._id, count: a.count }))
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get community analytics', { event: 'community_feed_and_moderation.admin_analytics.error', error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCommunityAnalytics = getCommunityAnalytics;
const adminGetPosts = async (req, res) => {
    try {
        const { cursor, limit, status, authorId, search, filter } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 20;
        const query = {};
        if (status && status !== 'all')
            query.status = status;
        if (authorId)
            query.author = authorId;
        if (cursor)
            query._id = { $lt: cursor };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } }
            ];
        }
        if (filter === "pinned")
            query.isPinned = true;
        if (filter === "hidden")
            query.isHidden = true;
        if (filter === "locked")
            query.isLocked = true;
        if (filter === "deleted")
            query.status = "removed";
        const posts = await community_post_model_1.default.find(query)
            .sort({ _id: -1 })
            .limit(qLimit + 1)
            .populate('author', 'name email role accountType');
        const hasNextPage = posts.length > qLimit;
        if (hasNextPage)
            posts.pop();
        const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;
        logger_1.logger.info('Admin retrieved community posts', { event: 'community_feed_and_moderation.admin_list_posts', requestId: req.id, limit: qLimit, count: posts.length });
        return res.status(200).json({
            success: true,
            data: {
                items: posts,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list community posts for admin', { event: 'community_feed_and_moderation.admin_list_posts.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminGetPosts = adminGetPosts;
const adminModeratePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason, version } = req.body;
        const adminId = req.user.id;
        const post = await community_post_model_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
        }
        if (post.version !== version) {
            return res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' });
        }
        const newStatus = action === 'approve' || action === 'restore' ? 'visible' : action === 'hide' ? 'hidden' : 'removed';
        post.status = newStatus;
        post.moderationReason = reason || '';
        post.moderatedBy = adminId;
        post.moderatedAt = new Date();
        post.version += 1;
        await post.save();
        logger_1.logger.info(`Admin moderated post ${id}`, {
            event: 'community_feed_and_moderation.admin_moderate_post',
            requestId: req.id,
            actorId: adminId,
            targetId: id,
            action,
            newStatus
        });
        return res.status(200).json({ success: true, data: { post } });
    }
    catch (error) {
        logger_1.logger.error('Failed to moderate post', { event: 'community_feed_and_moderation.admin_moderate_post.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminModeratePost = adminModeratePost;
const adminResolvePost = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const post = await community_post_model_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
        }
        post.status = 'resolved';
        post.moderationNotes = 'Admin intervened';
        post.moderatedBy = adminId;
        post.moderatedAt = new Date();
        post.version += 1;
        await post.save();
        logger_1.logger.info(`Admin resolved post ${id}`, {
            event: 'community_feed_and_moderation.admin_resolve_post',
            requestId: req.id,
            actorId: adminId,
            targetId: id
        });
        return res.status(200).json({ success: true, data: { post } });
    }
    catch (error) {
        logger_1.logger.error('Failed to resolve post', { event: 'community_feed_and_moderation.admin_resolve_post.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminResolvePost = adminResolvePost;
const adminGetComments = async (req, res) => {
    try {
        const { cursor, limit, status, authorId, postId } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 20;
        const query = {};
        if (status && status !== 'all')
            query.status = status;
        if (authorId)
            query.author = authorId;
        if (postId)
            query.post = postId;
        if (cursor)
            query._id = { $lt: cursor };
        const comments = await comment_model_1.default.find(query)
            .sort({ _id: -1 })
            .limit(qLimit + 1)
            .populate('author', 'name email role');
        const hasNextPage = comments.length > qLimit;
        if (hasNextPage)
            comments.pop();
        const nextCursor = comments.length > 0 ? comments[comments.length - 1]._id : null;
        logger_1.logger.info('Admin retrieved community comments', { event: 'community_feed_and_moderation.admin_list_comments', requestId: req.id, limit: qLimit, count: comments.length });
        return res.status(200).json({
            success: true,
            data: {
                items: comments,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list community comments for admin', { event: 'community_feed_and_moderation.admin_list_comments.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminGetComments = adminGetComments;
const adminModerateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason, version } = req.body;
        const adminId = req.user.id;
        const comment = await comment_model_1.default.findById(id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found', code: 'RESOURCE_NOT_FOUND' });
        }
        if (comment.version !== version) {
            return res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' });
        }
        const newStatus = action === 'approve' || action === 'restore' ? 'visible' : action === 'hide' ? 'hidden' : 'removed';
        comment.status = newStatus;
        comment.moderationReason = reason || '';
        comment.moderatedBy = adminId;
        comment.moderatedAt = new Date();
        comment.version += 1;
        await comment.save();
        logger_1.logger.info(`Admin moderated comment ${id}`, {
            event: 'community_feed_and_moderation.admin_moderate_comment',
            requestId: req.id,
            actorId: adminId,
            targetId: id,
            action,
            newStatus
        });
        return res.status(200).json({ success: true, data: { comment } });
    }
    catch (error) {
        logger_1.logger.error('Failed to moderate comment', { event: 'community_feed_and_moderation.admin_moderate_comment.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminModerateComment = adminModerateComment;
const adminUpdateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const adminId = req.user.id;
        const comment = await comment_model_1.default.findById(id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found', code: 'RESOURCE_NOT_FOUND' });
        }
        const allowedFields = ["text", "isHidden", "isPinned", "status"];
        allowedFields.forEach((field) => {
            if (updateData[field] !== undefined) {
                comment[field] = updateData[field];
            }
        });
        comment.lastEditedAt = new Date();
        comment.version += 1;
        await comment.save();
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(adminId, "COMMENT_UPDATED", comment.id, "Comment", updateData);
        logger_1.logger.info(`Admin updated comment ${id}`, {
            event: 'community_feed_and_moderation.admin_update_comment',
            requestId: req.id,
            actorId: adminId,
            targetId: id
        });
        return res.status(200).json({ success: true, data: { comment } });
    }
    catch (error) {
        logger_1.logger.error('Failed to update comment', { event: 'community_feed_and_moderation.admin_update_comment.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminUpdateComment = adminUpdateComment;
const getCommunityReputationStats = async (req, res) => {
    try {
        const [topContributor, mostFollowed, highestReputation, recentExperts, badgeDistribution] = await Promise.all([
            // Top Contributor by points
            user_reputation_model_1.default.findOne().sort({ points: -1 }).populate('userId', 'name role'),
            // Most Followed Expert
            follow_model_1.default.aggregate([
                { $group: { _id: "$following", followerCount: { $sum: 1 } } },
                { $sort: { followerCount: -1 } },
                { $limit: 1 }
            ]),
            // Highest Reputation (same as top contributor essentially, but could be different metric)
            user_reputation_model_1.default.findOne().sort({ points: -1 }).populate('userId', 'name'),
            // Recent Experts
            user_reputation_model_1.default.find({ level: { $in: ['Expert', 'Master'] } })
                .sort({ updatedAt: -1 })
                .limit(5)
                .populate('userId', 'name avatarUrl'),
            // Badge Distribution
            user_reputation_model_1.default.aggregate([
                { $unwind: "$badges" },
                { $group: { _id: "$badges", count: { $sum: 1 } } }
            ])
        ]);
        let mostFollowedUserDetails = null;
        if (mostFollowed.length > 0 && mostFollowed[0]._id) {
            // Need to populate the user info manually since aggregate doesn't
            mostFollowedUserDetails = await user_reputation_model_1.default.findOne({ userId: mostFollowed[0]._id }).populate('userId', 'name');
        }
        res.status(200).json({
            success: true,
            data: {
                topContributor: topContributor ? { name: topContributor.userId?.name, points: topContributor.points } : null,
                mostFollowed: mostFollowedUserDetails ? { name: mostFollowedUserDetails.userId?.name, followers: mostFollowed[0].followerCount } : null,
                highestReputation: highestReputation ? { name: highestReputation.userId?.name, points: highestReputation.points } : null,
                recentExperts: recentExperts.map(re => ({
                    name: re.userId?.name,
                    level: re.level,
                })),
                badgeDistribution: badgeDistribution.map(b => ({ badge: b._id, count: b.count }))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get community reputation stats', { event: 'community_feed_and_moderation.admin_get_reputation_stats.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCommunityReputationStats = getCommunityReputationStats;
const deleteAdminCommunityPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await community_post_model_1.default.findById(id);
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        post.status = "removed";
        await post.save();
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(req.user.id, "POST_DELETED", post.id, "CommunityPost");
        res.status(200).json({ success: true, message: "Post deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.deleteAdminCommunityPost = deleteAdminCommunityPost;
const restoreAdminCommunityPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await community_post_model_1.default.findById(id);
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        post.status = "visible";
        await post.save();
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(req.user.id, "POST_RESTORED", post.id, "CommunityPost");
        res.status(200).json({ success: true, message: "Post restored" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.restoreAdminCommunityPost = restoreAdminCommunityPost;
const deleteAdminCommunityComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await comment_model_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ success: false, message: "Comment not found" });
        comment.status = "removed";
        await comment.save();
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(req.user.id, "COMMENT_DELETED", comment.id, "Comment");
        res.status(200).json({ success: true, message: "Comment deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.deleteAdminCommunityComment = deleteAdminCommunityComment;
const restoreAdminCommunityComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await comment_model_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ success: false, message: "Comment not found" });
        comment.status = "visible";
        await comment.save();
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(req.user.id, "COMMENT_RESTORED", comment.id, "Comment");
        res.status(200).json({ success: true, message: "Comment restored" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.restoreAdminCommunityComment = restoreAdminCommunityComment;
const adminUpdatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const adminId = req.user.id;
        const post = await community_post_model_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
        }
        const allowedFields = [
            "title", "content", "plantTag", "imageUrls", "isPinned", "isHidden",
            "isLocked", "likes", "commentsCount", "sharesCount", "hashtags", "tags", "createdAt", "updatedAt", "status"
        ];
        allowedFields.forEach((field) => {
            if (updateData[field] !== undefined) {
                if ((field === "likes" || field === "commentsCount" || field === "sharesCount") && updateData[field] < 0) {
                    return; // Prevent negative metrics
                }
                post[field] = updateData[field];
            }
        });
        post.lastEditedAt = new Date();
        post.version += 1;
        await post.save();
        const AdminActivityLogService = (await Promise.resolve().then(() => __importStar(require('../services/admin_activity_log_service')))).AdminActivityLogService;
        await AdminActivityLogService.logAction(adminId, "POST_UPDATED", post.id, "CommunityPost", updateData);
        logger_1.logger.info(`Admin updated post ${id}`, {
            event: 'community_feed_and_moderation.admin_update_post',
            requestId: req.id,
            actorId: adminId,
            targetId: id
        });
        return res.status(200).json({ success: true, data: { post } });
    }
    catch (error) {
        logger_1.logger.error('Failed to update post', { event: 'community_feed_and_moderation.admin_update_post.error', error });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminUpdatePost = adminUpdatePost;
const getAdminLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const AdminActivityLog = (await Promise.resolve().then(() => __importStar(require('../models/admin_activity_log_model')))).default;
        const logs = await AdminActivityLog.find()
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await AdminActivityLog.countDocuments();
        res.status(200).json({
            success: true,
            data: logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get admin logs', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAdminLogs = getAdminLogs;
