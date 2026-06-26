"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityCenter = exports.getSavedPosts = exports.toggleSave = exports.deleteComment = exports.updateComment = exports.updatePost = exports.deletePost = exports.createComment = exports.getComments = exports.toggleLike = exports.createPost = exports.getTrendingPosts = exports.searchPosts = exports.getCommunityPosts = exports.formatRelativeTime = void 0;
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const comment_model_1 = __importDefault(require("../models/comment_model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const logger_1 = require("../utils/logger");
const app_error_1 = require("../utils/app_error");
const NotificationService_1 = require("../services/NotificationService");
const community_audit_service_1 = require("../services/community_audit_service");
const community_poll_model_1 = __importDefault(require("../models/community_poll_model"));
const community_poll_option_model_1 = __importDefault(require("../models/community_poll_option_model"));
const community_poll_vote_model_1 = __importDefault(require("../models/community_poll_vote_model"));
const saved_post_model_1 = __importDefault(require("../models/saved_post_model"));
// Helper function to upload buffer stream to Cloudinary
const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder: folderName, resource_type: "auto" }, (error, result) => {
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
exports.formatRelativeTime = formatRelativeTime;
const mapPostToDTO = async (post, userId) => {
    const isLikedByMe = post.likedBy?.map((id) => id.toString()).includes(userId);
    const isSaved = await saved_post_model_1.default.exists({ post: post._id, user: userId });
    let pollDto = null;
    if (post.poll) {
        const pollId = post.poll._id ? post.poll._id : post.poll;
        const pollObj = post.poll._id ? post.poll : await community_poll_model_1.default.findById(pollId).lean();
        if (pollObj) {
            const options = await community_poll_option_model_1.default.find({ poll: pollObj._id }).sort({ sortOrder: 1 }).lean();
            const vote = await community_poll_vote_model_1.default.findOne({ poll: pollObj._id, user: userId }).lean();
            pollDto = {
                id: pollObj._id.toString(),
                question: pollObj.question,
                totalVotes: pollObj.totalVotes,
                options: options.map(o => ({
                    id: o._id.toString(),
                    text: o.text,
                    votes: o.votes
                })),
                userVotedOptionId: vote ? vote.option.toString() : null
            };
        }
    }
    return {
        id: post._id.toString(),
        author: {
            id: post.author?._id?.toString() || post.author?.toString(),
            name: post.author?.name || post.authorName
        },
        authorRole: post.author?.role || "farmer",
        plantTag: post.plantTag,
        title: post.title,
        content: post.content,
        timeLabel: (0, exports.formatRelativeTime)(post.createdAt),
        likes: post.likes,
        comments: post.commentsCount,
        imagePath: post.imagePath || null,
        imageUrls: post.imageUrls || [],
        isLikedByMe,
        isSaved: !!isSaved,
        isPinned: post.isPinned || false,
        linkedDiagnosisId: post.linkedDiagnosis?._id?.toString() || null,
        diagnosisDisease: post.linkedDiagnosis?.diseaseNameEn || null,
        diagnosisConfidence: post.linkedDiagnosis?.confidence || null,
        diagnosisSeverity: post.linkedDiagnosis?.severity || null,
        poll: pollDto,
        createdAt: post.createdAt.toISOString()
    };
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
            .sort({ isPinned: -1, createdAt: -1, _id: -1 })
            .limit(qLimit + 1);
        const hasNextPage = posts.length > qLimit;
        if (hasNextPage)
            posts.pop();
        const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;
        const mappedPosts = await Promise.all(posts.map(p => mapPostToDTO(p, req.user.id)));
        res.status(200).json({
            success: true,
            data: {
                items: mappedPosts,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch posts" });
    }
};
exports.getCommunityPosts = getCommunityPosts;
// @desc    Search community posts
// @route   GET /api/community/search
// @access  Private
const searchPosts = async (req, res) => {
    try {
        const { q, cursor, limit, category, plantTag } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 10;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: "Search query 'q' is required" });
        }
        const query = {
            status: 'visible',
            $text: { $search: q }
        };
        if (category && category !== "all") {
            query.plantTag = category; // fallback logic if category is sent
        }
        if (plantTag && plantTag !== "all") {
            query.plantTag = plantTag;
        }
        let skip = 0;
        if (cursor) {
            skip = parseInt(cursor, 10);
            if (isNaN(skip))
                skip = 0;
        }
        let posts = await community_post_model_1.default.find(query, { score: { $meta: "textScore" } })
            .populate("author", "name role")
            .populate("linkedDiagnosis", "diseaseNameEn confidence severity")
            .sort({ score: { $meta: "textScore" }, _id: -1 })
            .skip(skip)
            .limit(qLimit + 1);
        const hasNextPage = posts.length > qLimit;
        if (hasNextPage)
            posts.pop();
        const nextCursor = hasNextPage ? (skip + qLimit).toString() : null;
        const mappedPosts = await Promise.all(posts.map(p => mapPostToDTO(p, req.user.id)));
        res.status(200).json({
            success: true,
            data: {
                items: mappedPosts,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to search posts', { event: 'community_feed_and_moderation.search_posts.error', error });
        res.status(500).json({ message: "Failed to search posts" });
    }
};
exports.searchPosts = searchPosts;
// @desc    Get trending community posts
// @route   GET /api/community/trending
// @access  Private
const getTrendingPosts = async (req, res) => {
    try {
        const { cursor, limit } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 10;
        const query = { status: 'visible' };
        let skip = 0;
        if (cursor) {
            skip = parseInt(cursor, 10);
            if (isNaN(skip))
                skip = 0;
        }
        // We'll calculate a simple trending score sorting by recent high engagement.
        // In a real app, this would be an aggregation pipeline.
        let posts = await community_post_model_1.default.aggregate([
            { $match: query },
            {
                $addFields: {
                    ageInHours: {
                        $divide: [
                            { $subtract: [new Date(), "$createdAt"] },
                            1000 * 60 * 60
                        ]
                    }
                }
            },
            {
                $addFields: {
                    trendingScore: {
                        $divide: [
                            { $add: [{ $multiply: ["$likes", 1.5] }, { $multiply: ["$commentsCount", 2] }] },
                            { $pow: [{ $add: ["$ageInHours", 2] }, 1.8] }
                        ]
                    }
                }
            },
            { $sort: { trendingScore: -1, _id: -1 } },
            { $skip: skip },
            { $limit: qLimit + 1 }
        ]);
        // Populate after aggregate
        posts = await community_post_model_1.default.populate(posts, [
            { path: "author", select: "name role" },
            { path: "linkedDiagnosis", select: "diseaseNameEn confidence severity" }
        ]);
        const hasNextPage = posts.length > qLimit;
        if (hasNextPage)
            posts.pop();
        const nextCursor = hasNextPage ? (skip + qLimit).toString() : null;
        const mappedPosts = await Promise.all(posts.map(p => mapPostToDTO(p, req.user.id)));
        res.status(200).json({
            success: true,
            data: {
                items: mappedPosts,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch trending posts', { event: 'community_feed_and_moderation.trending_posts.error', error });
        res.status(500).json({ message: "Failed to fetch trending posts" });
    }
};
exports.getTrendingPosts = getTrendingPosts;
// @desc    Create a community post
// @route   POST /api/community/posts
// @access  Private
const createPost = async (req, res) => {
    let uploadedImagePublicIds = [];
    try {
        const userId = req.user.id;
        const username = req.user.name;
        const { title, content, plantTag, clientOperationId, linkedDiagnosisId, pollQuestion, pollOptions } = req.body;
        // Validation is mostly handled by Zod now, but idempotency check happens here
        if (clientOperationId) {
            const existing = await community_post_model_1.default.findOne({ author: userId, clientOperationId })
                .populate("author", "name role")
                .populate("linkedDiagnosis", "diseaseNameEn confidence severity");
            if (existing) {
                const dto = await mapPostToDTO(existing, userId);
                return res.status(201).json({
                    success: true,
                    data: { post: dto }
                });
            }
        }
        let imageUrl = "";
        let imagePublicId = "";
        const imageUrls = [];
        const extractArray = (field) => {
            if (!field)
                return [];
            if (Array.isArray(field))
                return field;
            try {
                const parsed = JSON.parse(field);
                if (Array.isArray(parsed))
                    return parsed;
            }
            catch (e) { }
            return [field];
        };
        imageUrls.push(...extractArray(req.body.existingImageUrls));
        imageUrls.push(...extractArray(req.body['existingImageUrls[]']));
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const file of req.files) {
                const uploadResult = await uploadToCloudinary(file.buffer, "community_posts");
                imageUrls.push(uploadResult.url);
                uploadedImagePublicIds.push(uploadResult.public_id);
            }
        }
        else if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer, "community_posts");
            imageUrls.push(uploadResult.url);
            uploadedImagePublicIds.push(uploadResult.public_id);
        }
        if (imageUrls.length > 0) {
            imageUrl = imageUrls[0];
            if (uploadedImagePublicIds.length > 0) {
                imagePublicId = uploadedImagePublicIds[0];
            }
        }
        let linkedPollId = undefined;
        if (pollQuestion && pollOptions) {
            const optionsArray = Array.isArray(pollOptions) ? pollOptions : [pollOptions];
            if (optionsArray.length >= 2) {
                const poll = await community_poll_model_1.default.create({
                    question: pollQuestion.trim(),
                    totalVotes: 0,
                });
                linkedPollId = poll._id;
                let sortOrder = 0;
                for (const opt of optionsArray) {
                    await community_poll_option_model_1.default.create({
                        poll: poll._id,
                        text: opt.trim(),
                        votes: 0,
                        sortOrder: sortOrder++,
                    });
                }
            }
        }
        const post = await community_post_model_1.default.create({
            author: userId,
            authorName: username,
            plantTag,
            title: title.trim(),
            content: content.trim(),
            imagePath: imageUrl,
            imagePublicId,
            imageUrls,
            clientOperationId,
            linkedDiagnosis: linkedDiagnosisId || undefined,
            poll: linkedPollId,
        });
        try {
            await community_audit_service_1.CommunityAuditService.logAction(userId, 'CREATE_POST', 'CommunityPost', post._id.toString(), { title: post.title.substring(0, 50), plantTag });
            logger_1.logger.info('Created community post', {
                event: 'community_feed_and_moderation.create_post',
                requestId: req.id,
                actorId: userId,
                targetId: post._id,
                payload: { title: post.title.substring(0, 50), plantTag }
            });
            // Notify followers
            const mongoose = require('mongoose');
            const Follow = mongoose.model('Follow');
            const followers = await Follow.find({ following: new mongoose.Types.ObjectId(userId) });
            for (const follow of followers) {
                await NotificationService_1.NotificationService.sendNotification({
                    userId: follow.follower.toString(),
                    actorId: userId,
                    type: 'NEW_POST_FROM_FOLLOWING',
                    entityId: post._id.toString(),
                    entityType: 'CommunityPost',
                    postId: post._id.toString(),
                    title: 'New Post',
                    message: `${username} published a new post.`
                });
            }
        }
        catch (auditErr) {
            logger_1.logger.error('Failed to log audit action for CREATE_POST or notify followers', { error: auditErr, postId: post._id });
        }
        const populatedPost = await community_post_model_1.default.findById(post._id)
            .populate("author", "name role")
            .populate("linkedDiagnosis", "diseaseNameEn confidence severity");
        const dto = await mapPostToDTO(populatedPost, userId);
        res.status(201).json({
            success: true,
            data: { post: dto }
        });
    }
    catch (error) {
        // Cloudinary Cleanup on Failure
        for (const pubId of uploadedImagePublicIds) {
            await cloudinary_1.default.uploader.destroy(pubId).catch(err => logger_1.logger.error('Cloudinary cleanup failed', err));
        }
        if (error.code === 11000) {
            if (req.body.clientOperationId) {
                const existing = await community_post_model_1.default.findOne({ author: req.user.id, clientOperationId: req.body.clientOperationId })
                    .populate("author", "name role")
                    .populate("linkedDiagnosis", "diseaseNameEn confidence severity");
                if (existing) {
                    const dto = await mapPostToDTO(existing, req.user.id);
                    return res.status(201).json({
                        success: true,
                        data: { post: dto }
                    });
                }
            }
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
        // Spec: body.liked=true means like, false means unlike
        const wantsToLike = req.body?.liked;
        const post = await community_post_model_1.default.findOne({ _id: postId, status: 'visible' });
        if (!post) {
            return res.status(404).json({ error: "Post not found", errorCode: 'RESOURCE_NOT_FOUND' });
        }
        const hasLiked = post.likedBy.map((id) => id.toString()).includes(userId);
        // Determine desired state: if wantsToLike is explicitly provided, use it; otherwise toggle
        const shouldLike = wantsToLike !== undefined ? wantsToLike : !hasLiked;
        let liked = false;
        if (!shouldLike) {
            // Unlike atomically
            await community_post_model_1.default.findOneAndUpdate({ _id: postId, likedBy: userId }, {
                $pull: { likedBy: userId },
                $inc: { likes: -1 }
            });
            liked = false;
        }
        else {
            // Like atomically
            const result = await community_post_model_1.default.findOneAndUpdate({ _id: postId, likedBy: { $ne: userId } }, {
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            }, { new: true });
            liked = true;
            // Send Notification to post author if not liking own post
            if (result && post.author.toString() !== userId) {
                NotificationService_1.NotificationService.sendNotification({
                    userId: post.author.toString(),
                    actorId: userId,
                    type: 'LIKE_POST',
                    entityId: post._id.toString(),
                    entityType: 'CommunityPost',
                    postId: post._id.toString(),
                    title: 'New Like',
                    message: `${req.user.name || 'Someone'} liked your post "${post.title.substring(0, 20)}..."`
                }).catch(e => logger_1.logger.error('Error sending like notification', { error: e }));
            }
        }
        // Fetch the updated post to get the true current count
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
            .sort({ createdAt: 1 })
            .populate('author', 'name role');
        const topLevelComments = [];
        const repliesMap = new Map();
        for (const c of comments) {
            if (c.parentId) {
                const pId = c.parentId.toString();
                if (!repliesMap.has(pId))
                    repliesMap.set(pId, []);
                repliesMap.get(pId).push(c);
            }
            else {
                topLevelComments.push(c);
            }
        }
        // Apply pagination only to top-level comments for simplicity (or as requested)
        // We reverse the top level comments if we want newest first, but spec usually wants oldest first or newest first
        topLevelComments.reverse();
        const hasNextPage = topLevelComments.length > qLimit;
        if (hasNextPage)
            topLevelComments.pop();
        const nextCursor = topLevelComments.length > 0 ? topLevelComments[topLevelComments.length - 1]._id : null;
        const mapCommentToDTO = (comment) => {
            const authorRole = comment.author?.role || "farmer";
            return {
                id: comment._id.toString(),
                author: {
                    id: comment.author?._id?.toString() || comment.author?.toString(),
                    name: comment.author?.name || comment.authorName
                },
                authorRole,
                content: comment.text,
                createdAt: comment.createdAt.toISOString(),
                isExpert: authorRole === "expert" || authorRole === "agronomist",
                parentId: comment.parentId?.toString() || null,
                replies: (repliesMap.get(comment._id.toString()) || []).map((r) => mapCommentToDTO(r))
            };
        };
        const mappedComments = topLevelComments.map(mapCommentToDTO);
        res.status(200).json({
            success: true,
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
        const { text, clientOperationId, parentId } = req.body;
        const postId = req.params.id;
        if (clientOperationId) {
            const existing = await comment_model_1.default.findOne({ author: userId, post: postId, clientOperationId }).populate('author', 'name role');
            if (existing) {
                const authorRole = existing.author?.role || "farmer";
                return res.status(201).json({
                    success: true,
                    data: {
                        comment: {
                            id: existing._id,
                            author: { id: existing.author?._id || userId, name: existing.authorName },
                            authorRole,
                            content: existing.text,
                            createdAt: existing.createdAt.toISOString(),
                            isExpert: authorRole === "expert" || authorRole === "agronomist",
                            parentId: existing.parentId?.toString() || null,
                            replies: []
                        }
                    }
                });
            }
        }
        const post = await community_post_model_1.default.findOne({ _id: postId, status: 'visible' });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found or unavailable", code: 'RESOURCE_NOT_FOUND' });
        }
        let parentComment = null;
        if (parentId) {
            parentComment = await comment_model_1.default.findOne({ _id: parentId, post: postId });
            if (!parentComment) {
                return res.status(404).json({ success: false, message: "Parent comment not found", code: 'RESOURCE_NOT_FOUND' });
            }
        }
        // Create comment
        const comment = await comment_model_1.default.create({
            post: post._id,
            author: userId,
            authorName: username,
            text: text.trim(),
            clientOperationId,
            parentId: parentId || undefined,
        });
        const populatedComment = await comment_model_1.default.findById(comment._id).populate('author', 'name role');
        const authorRole = populatedComment?.author?.role || "farmer";
        // Atomically increment comment count
        await community_post_model_1.default.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });
        // Send Notification
        if (parentId && parentComment) {
            if (parentComment.author.toString() !== userId) {
                NotificationService_1.NotificationService.sendNotification({
                    userId: parentComment.author.toString(),
                    actorId: userId,
                    type: 'REPLY_COMMENT',
                    entityId: post._id.toString(),
                    entityType: 'CommunityPost',
                    postId: post._id.toString(),
                    commentId: comment._id.toString(),
                    title: 'New Reply',
                    message: `${username} replied to your comment on "${post.title.substring(0, 20)}..."`
                }).catch(e => logger_1.logger.error('Error sending reply notification', { error: e }));
            }
        }
        else {
            if (post.author.toString() !== userId) {
                NotificationService_1.NotificationService.sendNotification({
                    userId: post.author.toString(),
                    actorId: userId,
                    type: 'COMMENT_POST',
                    entityId: post._id.toString(),
                    entityType: 'CommunityPost',
                    postId: post._id.toString(),
                    commentId: comment._id.toString(),
                    title: 'New Comment',
                    message: `${username} commented on your post "${post.title.substring(0, 20)}..."`
                }).catch(e => logger_1.logger.error('Error sending comment notification', { error: e }));
            }
        }
        await community_audit_service_1.CommunityAuditService.logAction(userId, 'CREATE_COMMENT', 'Comment', comment._id.toString(), { postId: post._id.toString(), textLength: text.length });
        logger_1.logger.info('Created comment on post', {
            event: 'community_feed_and_moderation.create_comment',
            requestId: req.id,
            actorId: userId,
            targetId: comment._id,
            payload: { postId: post._id, textLength: text.length }
        });
        res.status(201).json({
            success: true,
            data: {
                comment: {
                    id: comment._id.toString(),
                    author: { id: populatedComment?.author?._id || userId, name: comment.authorName },
                    authorRole,
                    content: comment.text,
                    createdAt: comment.createdAt.toISOString(),
                    isExpert: authorRole === "expert" || authorRole === "agronomist",
                    parentId: comment.parentId?.toString() || null,
                    replies: []
                }
            }
        });
    }
    catch (error) {
        if (error.code === 11000) {
            if (req.body.clientOperationId) {
                const existing = await comment_model_1.default.findOne({ author: req.user.id, post: req.params.id, clientOperationId: req.body.clientOperationId }).populate('author', 'name role');
                if (existing) {
                    const authorRole = existing.author?.role || "farmer";
                    return res.status(201).json({
                        success: true,
                        data: {
                            comment: {
                                id: existing._id,
                                author: { id: existing.author?._id || req.user.id, name: existing.authorName },
                                authorRole,
                                content: existing.text,
                                createdAt: existing.createdAt.toISOString(),
                                isExpert: authorRole === "expert" || authorRole === "agronomist",
                                parentId: existing.parentId?.toString() || null,
                                replies: []
                            }
                        }
                    });
                }
            }
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
            return res.status(403).json({ error: "You can only delete your own posts", errorCode: 'AUTH_FORBIDDEN' });
        }
        await community_post_model_1.default.updateOne({ _id: postId }, { status: 'removed' });
        // Delete images from Cloudinary
        if (post.imageUrls && post.imageUrls.length > 0) {
            for (const url of post.imageUrls) {
                try {
                    const parts = url.split('/');
                    const publicIdWithExt = parts[parts.length - 1];
                    const publicId = 'community_posts/' + publicIdWithExt.split('.')[0];
                    await cloudinary_1.default.uploader.destroy(publicId);
                }
                catch (err) {
                    logger_1.logger.error('Failed to delete image from Cloudinary on post delete', { url, err });
                }
            }
        }
        else if (post.imagePublicId) {
            try {
                await cloudinary_1.default.uploader.destroy(post.imagePublicId);
            }
            catch (err) { }
        }
        await community_audit_service_1.CommunityAuditService.logAction(userId, 'DELETE_POST', 'CommunityPost', postId);
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
// @desc    Update a community post
// @route   PUT /api/community/posts/:id
// @access  Private
const updatePost = async (req, res, next) => {
    let uploadedImagePublicIds = [];
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const { title, content, plantTag } = req.body;
        const post = await community_post_model_1.default.findOne({ _id: postId });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found", code: 'RESOURCE_NOT_FOUND' });
        }
        if (post.author.toString() !== userId) {
            return res.status(403).json({ error: "You can only edit your own posts", errorCode: 'AUTH_FORBIDDEN' });
        }
        if (title)
            post.title = title;
        if (content)
            post.content = content;
        if (plantTag)
            post.plantTag = plantTag;
        post.lastEditedAt = new Date();
        let imageUrls = [];
        const extractArray = (field) => {
            if (!field)
                return [];
            if (Array.isArray(field))
                return field;
            try {
                const parsed = JSON.parse(field);
                if (Array.isArray(parsed))
                    return parsed;
            }
            catch (e) { }
            return [field];
        };
        imageUrls.push(...extractArray(req.body.existingImageUrls));
        imageUrls.push(...extractArray(req.body['existingImageUrls[]']));
        const removedUrls = (post.imageUrls || []).filter(url => !imageUrls.includes(url));
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const file of req.files) {
                const uploadResult = await uploadToCloudinary(file.buffer, "community_posts");
                imageUrls.push(uploadResult.url);
                uploadedImagePublicIds.push(uploadResult.public_id);
            }
        }
        else if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer, "community_posts");
            imageUrls.push(uploadResult.url);
            uploadedImagePublicIds.push(uploadResult.public_id);
        }
        if (imageUrls.length > 0) {
            post.imagePath = imageUrls[0];
            post.imageUrls = imageUrls;
            if (uploadedImagePublicIds.length > 0) {
                post.imagePublicId = uploadedImagePublicIds[0];
            }
        }
        else {
            post.imagePath = undefined;
            post.imageUrls = [];
            post.imagePublicId = undefined;
        }
        // Clean up orphaned Cloudinary images
        for (const url of removedUrls) {
            try {
                const parts = url.split('/');
                const publicIdWithExt = parts[parts.length - 1];
                const publicId = 'community_posts/' + publicIdWithExt.split('.')[0];
                await cloudinary_1.default.uploader.destroy(publicId);
            }
            catch (err) {
                logger_1.logger.error('Failed to delete orphaned image from Cloudinary', { url, err });
            }
        }
        await post.save();
        try {
            await community_audit_service_1.CommunityAuditService.logAction(userId, 'UPDATE_POST', 'CommunityPost', postId, { plantTag: post.plantTag });
            logger_1.logger.info('User updated community post', {
                event: 'community_feed_and_moderation.update_post',
                requestId: req.id,
                actorId: userId,
                targetId: postId,
            });
        }
        catch (auditErr) {
            logger_1.logger.error('Failed to log audit action for UPDATE_POST', { error: auditErr, postId });
        }
        const populatedPost = await community_post_model_1.default.findById(post._id)
            .populate("author", "name role")
            .populate("linkedDiagnosis", "diseaseNameEn confidence severity");
        const dto = await mapPostToDTO(populatedPost, userId);
        res.status(200).json({
            success: true,
            data: { post: dto }
        });
    }
    catch (error) {
        // Cloudinary Cleanup on Failure
        for (const pubId of uploadedImagePublicIds) {
            await cloudinary_1.default.uploader.destroy(pubId).catch(err => logger_1.logger.error('Cloudinary cleanup failed', err));
        }
        logger_1.logger.error('Failed to update post', { event: 'community_feed_and_moderation.update_post.error', error });
        res.status(500).json({ message: "Failed to update post" });
    }
};
exports.updatePost = updatePost;
// @desc    Update a comment
// @route   PUT /api/community/posts/:id/comments/:commentId
// @access  Private
const updateComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.commentId;
        const { text } = req.body;
        const comment = await comment_model_1.default.findOne({ _id: commentId });
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found", code: 'RESOURCE_NOT_FOUND' });
        }
        if (comment.author.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to edit this comment", code: 'FORBIDDEN' });
        }
        comment.text = text;
        comment.lastEditedAt = new Date();
        await comment.save();
        await community_audit_service_1.CommunityAuditService.logAction(userId, 'UPDATE_COMMENT', 'Comment', commentId);
        logger_1.logger.info('User updated comment', {
            event: 'community_feed_and_moderation.update_comment',
            requestId: req.id,
            actorId: userId,
            targetId: commentId,
        });
        res.status(200).json({
            success: true,
            comment: {
                id: comment._id,
                authorName: comment.authorName,
                text: comment.text,
                timeLabel: (0, exports.formatRelativeTime)(comment.createdAt),
                lastEditedAt: comment.lastEditedAt,
            },
            data: { comment }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update comment', { event: 'community_feed_and_moderation.update_comment.error', error });
        res.status(500).json({ message: "Failed to update comment" });
    }
};
exports.updateComment = updateComment;
// @desc    Delete a comment
// @route   DELETE /api/community/posts/:id/comments/:commentId
// @access  Private
const deleteComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.commentId;
        const postId = req.params.id;
        const comment = await comment_model_1.default.findOne({ _id: commentId });
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found", code: 'RESOURCE_NOT_FOUND' });
        }
        if (comment.author.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this comment", code: 'FORBIDDEN' });
        }
        const result = await comment_model_1.default.findOneAndUpdate({ _id: commentId, status: { $ne: 'removed' } }, { status: 'removed' }, { new: true });
        if (result) {
            await community_post_model_1.default.updateOne({ _id: postId }, { $inc: { commentsCount: -1 } });
        }
        else {
            return res.status(400).json({ success: false, message: "Comment already removed" });
        }
        await community_audit_service_1.CommunityAuditService.logAction(userId, 'DELETE_COMMENT', 'Comment', commentId);
        logger_1.logger.info('User deleted comment', {
            event: 'community_feed_and_moderation.delete_comment',
            requestId: req.id,
            actorId: userId,
            targetId: commentId,
        });
        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete comment', { event: 'community_feed_and_moderation.delete_comment.error', error });
        res.status(500).json({ message: "Failed to delete comment" });
    }
};
exports.deleteComment = deleteComment;
// @desc    Toggle save post status
// @route   POST /api/community/posts/:id/save
// @access  Private
const toggleSave = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        // Spec: body.saved=true means save, false means unsave
        const wantsToSave = req.body?.saved;
        const post = await community_post_model_1.default.findOne({ _id: postId, status: 'visible' });
        if (!post) {
            return res.status(404).json({ error: "Post not found", errorCode: 'RESOURCE_NOT_FOUND' });
        }
        const existingSave = await saved_post_model_1.default.findOne({ user: userId, post: postId });
        const isSaved = !!existingSave;
        // Determine desired state: if wantsToSave explicitly provided, use it; otherwise toggle
        const shouldSave = wantsToSave !== undefined ? wantsToSave : !isSaved;
        let saved = false;
        if (!shouldSave && isSaved) {
            await saved_post_model_1.default.deleteOne({ _id: existingSave._id });
        }
        else if (shouldSave && !isSaved) {
            await saved_post_model_1.default.create({ user: userId, post: postId });
            saved = true;
        }
        else {
            // No change needed
            saved = isSaved;
        }
        logger_1.logger.info(`User ${saved ? 'saved' : 'unsaved'} post`, {
            event: 'community_feed_and_moderation.toggle_save',
            actorId: userId,
            targetId: postId,
            result: saved ? 'saved' : 'unsaved'
        });
        res.status(200).json({
            success: true,
            data: { saved }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to toggle save post', { error });
        res.status(500).json({ message: "Failed to toggle save post" });
    }
};
exports.toggleSave = toggleSave;
// @desc    Get saved posts
// @route   GET /api/community/saved
// @access  Private
const getSavedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cursor, limit } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 20;
        const query = { user: userId };
        if (cursor) {
            query._id = { $lt: cursor };
        }
        const savedPosts = await saved_post_model_1.default.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .limit(qLimit + 1)
            .populate({
            path: 'post',
            match: { status: 'visible' },
            populate: [
                { path: 'author', select: 'name role' },
                { path: 'linkedDiagnosis', select: 'diseaseNameEn confidence severity' }
            ]
        });
        // Filter out posts that might have been removed
        const validSavedPosts = savedPosts.filter(sp => sp.post != null);
        const hasNextPage = validSavedPosts.length > qLimit;
        if (hasNextPage)
            validSavedPosts.pop();
        const nextCursor = validSavedPosts.length > 0 ? validSavedPosts[validSavedPosts.length - 1]._id : null;
        const mappedPosts = await Promise.all(validSavedPosts.map(sp => mapPostToDTO(sp.post, userId)));
        res.status(200).json({
            success: true,
            data: {
                items: mappedPosts,
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get saved posts', { error });
        res.status(500).json({ message: "Failed to get saved posts" });
    }
};
exports.getSavedPosts = getSavedPosts;
// @desc    Get user activity center timeline
// @route   GET /api/community/activity
// @access  Private
const getActivityCenter = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        // Aggregate posts
        const posts = await community_post_model_1.default.find({ author: userId })
            .select('_id title content createdAt likes commentsCount plantTag')
            .sort({ createdAt: -1 })
            .lean();
        // Aggregate comments
        const comments = await comment_model_1.default.find({ author: userId })
            .select('_id postId text createdAt')
            .populate('postId', 'title author')
            .sort({ createdAt: -1 })
            .lean();
        // Mapping items to a unified timeline
        const activities = [
            ...posts.map(p => ({
                type: 'POST_CREATED',
                id: p._id,
                entityId: p._id,
                content: p.title || p.content.substring(0, 50),
                plantTag: p.plantTag,
                stats: { likes: p.likes, comments: p.commentsCount },
                createdAt: p.createdAt
            })),
            ...comments.map((c) => {
                const post = c.postId;
                return {
                    type: 'COMMENT_CREATED',
                    id: c._id,
                    entityId: post?._id,
                    postTitle: post?.title,
                    content: c.text,
                    createdAt: c.createdAt
                };
            })
        ];
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const paginatedActivities = activities.slice(skip, skip + limit);
        res.status(200).json({
            success: true,
            data: {
                items: paginatedActivities,
                pageInfo: {
                    page,
                    limit,
                    total: activities.length,
                    pages: Math.ceil(activities.length / limit)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get activity center', { error });
        res.status(500).json({ message: "Failed to get activity center data" });
    }
};
exports.getActivityCenter = getActivityCenter;
