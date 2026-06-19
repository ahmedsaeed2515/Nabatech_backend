"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.createComment = exports.getComments = exports.toggleLike = exports.createPost = exports.getCommunityPosts = void 0;
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const comment_model_1 = __importDefault(require("../models/comment_model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const logger_1 = require("../utils/logger");
const app_error_1 = require("../utils/app_error");
// Helper function to upload buffer stream to Cloudinary
const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder: folderName }, (error, result) => {
            if (error)
                return reject(error);
            resolve({ url: result.secure_url, public_id: result.public_id });
        });
        stream.end(fileBuffer);
    });
};
// Helper function to format creation date as relative label
const formatRelativeTime = (date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1)
        return "now";
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};
// @desc    Get all community posts
// @route   GET /api/community/posts
// @access  Private
const getCommunityPosts = async (req, res) => {
    try {
        const { category, cursor, limit, status, authorId } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 20;
        const query = { status: 'visible' };
        if (authorId) {
            query.author = authorId;
        }
        if (category && category !== "all") {
            let mappedTag = category;
            if (mappedTag.toLowerCase() === "diagnosis")
                mappedTag = "Diagnosis";
            else if (mappedTag.toLowerCase() === "care_tips")
                mappedTag = "Care Tips";
            else if (mappedTag.toLowerCase() === "watering")
                mappedTag = "Watering";
            else if (mappedTag.toLowerCase() === "pests")
                mappedTag = "Pests";
            query.plantTag = mappedTag;
        }
        if (cursor) {
            query._id = { $lt: cursor };
        }
        let posts = await community_post_model_1.default.find(query)
            .populate("author", "name role")
            .populate("linkedDiagnosis", "diseaseNameEn confidence severity")
            .sort({ createdAt: -1, _id: -1 })
            .limit(qLimit + 1);
        const hasNextPage = posts.length > qLimit;
        if (hasNextPage)
            posts.pop();
        const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;
        const mappedPosts = posts.map(p => ({
            id: p._id,
            author: p.author,
            authorName: p.authorName,
            authorRole: p.author?.role ?? "farmer",
            plantTag: p.plantTag,
            title: p.title,
            content: p.content,
            timeLabel: formatRelativeTime(p.createdAt),
            likes: p.likes,
            comments: p.commentsCount,
            imagePath: p.imagePath,
            liked: p.likedBy.includes(req.user.id),
            linkedDiagnosisId: p.linkedDiagnosis?._id?.toString(),
            diagnosisDisease: p.linkedDiagnosis?.diseaseNameEn,
            diagnosisConfidence: p.linkedDiagnosis?.confidence,
            diagnosisSeverity: p.linkedDiagnosis?.severity,
        }));
        res.status(200).json({
            success: true,
            count: mappedPosts.length, // legacy
            posts: mappedPosts, // legacy
            data: {
                items: mappedPosts,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch posts', { event: 'community_feed_and_moderation.list_posts.error', error });
        res.status(500).json({ message: "Failed to fetch posts" });
    }
};
exports.getCommunityPosts = getCommunityPosts;
// @desc    Create a community post
// @route   POST /api/community/posts
// @access  Private
const createPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const username = req.user.name;
        const { title, content, plantTag, clientOperationId, linkedDiagnosisId } = req.body;
        // Validation is mostly handled by Zod now, but idempotency check happens here
        if (clientOperationId) {
            const existing = await community_post_model_1.default.findOne({ author: userId, clientOperationId });
            if (existing) {
                return res.status(201).json({
                    success: true,
                    post: {
                        id: existing._id,
                        authorName: existing.authorName,
                        plantTag: existing.plantTag,
                        title: existing.title,
                        content: existing.content,
                        likes: existing.likes,
                        comments: existing.commentsCount,
                        imagePath: existing.imagePath
                    },
                    data: { post: existing }
                });
            }
        }
        let imageUrl = "";
        let imagePublicId = "";
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer, "community_posts");
            imageUrl = uploadResult.url;
            imagePublicId = uploadResult.public_id;
        }
        const post = await community_post_model_1.default.create({
            author: userId,
            authorName: username,
            plantTag,
            title: title.trim(),
            content: content.trim(),
            imagePath: imageUrl,
            imagePublicId,
            clientOperationId,
            linkedDiagnosis: linkedDiagnosisId || undefined,
        });
        logger_1.logger.info('Created community post', {
            event: 'community_feed_and_moderation.create_post',
            requestId: req.id,
            actorId: userId,
            targetId: post._id,
            payload: { title: post.title.substring(0, 50), plantTag }
        });
        res.status(201).json({
            success: true,
            post: {
                id: post._id,
                authorName: post.authorName,
                plantTag: post.plantTag,
                title: post.title,
                content: post.content,
                likes: post.likes,
                comments: post.commentsCount,
                imagePath: post.imagePath
            },
            data: { post }
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' });
        }
        logger_1.logger.error('Failed to create post', { event: 'community_feed_and_moderation.create_post.error', error });
        res.status(500).json({ message: "Failed to create post" });
    }
};
exports.createPost = createPost;
// @desc    Toggle post like status
// @route   POST /api/community/posts/:id/like
// @access  Private
const toggleLike = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await community_post_model_1.default.findOne({ _id: postId, status: 'visible' });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found", code: 'RESOURCE_NOT_FOUND' });
        }
        const hasLiked = post.likedBy.includes(userId);
        let liked = false;
        if (hasLiked) {
            // Unlike atomically
            await community_post_model_1.default.updateOne({ _id: postId }, {
                $pull: { likedBy: userId },
                $inc: { likes: -1 }
            });
        }
        else {
            // Like atomically
            await community_post_model_1.default.updateOne({ _id: postId }, {
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            });
            liked = true;
        }
        // Fetch the updated post to get the true current state
        const updatedPost = await community_post_model_1.default.findById(postId);
        logger_1.logger.info(`User ${liked ? 'liked' : 'unliked'} post`, {
            event: 'community_feed_and_moderation.toggle_like',
            requestId: req.id,
            actorId: userId,
            targetId: postId,
            result: liked ? 'liked' : 'unliked'
        });
        res.status(200).json({
            success: true,
            likes: updatedPost?.likes || 0,
            liked,
            data: { liked, likes: updatedPost?.likes || 0 }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to toggle like', { event: 'community_feed_and_moderation.toggle_like.error', error });
        res.status(500).json({ message: "Failed to toggle like" });
    }
};
exports.toggleLike = toggleLike;
// @desc    Get comments of a post
// @route   GET /api/community/posts/:id/comments
// @access  Private
const getComments = async (req, res) => {
    try {
        const { cursor, limit } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 50;
        const query = { post: req.params.id, status: 'visible' };
        if (cursor) {
            query._id = { $lt: cursor };
        }
        const comments = await comment_model_1.default.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .populate('author', 'role')
            .limit(qLimit + 1);
        // Seed mock comments if list is empty
        if (comments.length === 0 && !cursor && (req.params.id === "p1" || req.params.id === "p2")) {
            const seedComments = [
                {
                    post: req.params.id,
                    author: req.user.id,
                    authorName: "Nour",
                    text: "Try reducing fertilizer concentration to half dose next time.",
                    status: 'visible'
                },
                {
                    post: req.params.id,
                    author: req.user.id,
                    authorName: "Karim",
                    text: "Flush the soil once and monitor new leaves for a week.",
                    status: 'visible'
                }
            ];
            await comment_model_1.default.create(seedComments);
            return res.status(200).json({
                success: true,
                comments: seedComments.map((c, idx) => ({
                    id: `seeded_${idx}`,
                    authorName: c.authorName,
                    text: c.text,
                    timeLabel: "now",
                })),
                data: { items: seedComments, pageInfo: { hasNextPage: false, nextCursor: null } }
            });
        }
        const hasNextPage = comments.length > qLimit;
        if (hasNextPage)
            comments.pop();
        const nextCursor = comments.length > 0 ? comments[comments.length - 1]._id : null;
        const mappedComments = comments.map(c => ({
            id: c._id,
            authorName: c.authorName,
            authorRole: c.author?.role ?? 'user',
            text: c.text,
            timeLabel: formatRelativeTime(c.createdAt),
        }));
        res.status(200).json({
            success: true,
            comments: mappedComments, // legacy
            data: {
                items: mappedComments,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch comments', { event: 'community_feed_and_moderation.list_comments.error', error });
        res.status(500).json({ message: "Failed to fetch comments" });
    }
};
exports.getComments = getComments;
// @desc    Add a comment
// @route   POST /api/community/posts/:id/comments
// @access  Private
const createComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const username = req.user.name;
        const { text, clientOperationId } = req.body;
        const postId = req.params.id;
        if (clientOperationId) {
            const existing = await comment_model_1.default.findOne({ author: userId, post: postId, clientOperationId });
            if (existing) {
                return res.status(201).json({
                    success: true,
                    comment: {
                        id: existing._id,
                        authorName: existing.authorName,
                        text: existing.text,
                        timeLabel: formatRelativeTime(existing.createdAt),
                    },
                    data: { comment: existing }
                });
            }
        }
        const post = await community_post_model_1.default.findOne({ _id: postId, status: 'visible' });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found or unavailable", code: 'RESOURCE_NOT_FOUND' });
        }
        // Create comment
        const comment = await comment_model_1.default.create({
            post: post._id,
            author: userId,
            authorName: username,
            text: text.trim(),
            clientOperationId,
        });
        // Atomically increment comment count
        await community_post_model_1.default.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });
        logger_1.logger.info('Created comment on post', {
            event: 'community_feed_and_moderation.create_comment',
            requestId: req.id,
            actorId: userId,
            targetId: comment._id,
            payload: { postId: post._id, textLength: text.length }
        });
        res.status(201).json({
            success: true,
            comment: {
                id: comment._id,
                authorName: comment.authorName,
                authorRole: req.user.role ?? 'user',
                text: comment.text,
                timeLabel: "now",
            },
            data: { comment }
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' });
        }
        if (error.name === 'ValidationError') {
            return next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
        }
        logger_1.logger.error('Failed to create comment', { event: 'community_feed_and_moderation.create_comment.error', error });
        next(error);
    }
};
exports.createComment = createComment;
// @desc    Delete a community post
// @route   DELETE /api/community/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await community_post_model_1.default.findOne({ _id: postId });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found", code: 'RESOURCE_NOT_FOUND' });
        }
        if (post.author.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this post", code: 'FORBIDDEN' });
        }
        await community_post_model_1.default.updateOne({ _id: postId }, { status: 'removed' });
        logger_1.logger.info('User deleted community post', {
            event: 'community_feed_and_moderation.delete_post',
            requestId: req.id,
            actorId: userId,
            targetId: postId,
        });
        res.status(200).json({ success: true, message: "Post deleted successfully" });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete post', { event: 'community_feed_and_moderation.delete_post.error', error });
        res.status(500).json({ message: "Failed to delete post" });
    }
};
exports.deletePost = deletePost;
