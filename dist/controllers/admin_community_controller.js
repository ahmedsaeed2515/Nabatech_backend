"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminModerateComment = exports.adminGetComments = exports.adminResolvePost = exports.adminModeratePost = exports.adminGetPosts = void 0;
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const comment_model_1 = __importDefault(require("../models/comment_model"));
const logger_1 = require("../utils/logger");
const adminGetPosts = async (req, res) => {
    try {
        const { cursor, limit, status, authorId } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 20;
        const query = {};
        if (status && status !== 'all')
            query.status = status;
        if (authorId)
            query.author = authorId;
        if (cursor)
            query._id = { $lt: cursor };
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
