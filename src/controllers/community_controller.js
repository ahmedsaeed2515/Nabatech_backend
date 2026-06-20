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
exports.deletePost = exports.createComment = exports.getComments = exports.toggleLike = exports.createPost = exports.getCommunityPosts = void 0;
var community_post_model_1 = __importDefault(require("../models/community_post_model"));
var comment_model_1 = __importDefault(require("../models/comment_model"));
var cloudinary_1 = __importDefault(require("../config/cloudinary"));
var logger_1 = require("../utils/logger");
var app_error_1 = require("../utils/app_error");
// Helper function to upload buffer stream to Cloudinary
var uploadToCloudinary = function (fileBuffer, folderName) {
    return new Promise(function (resolve, reject) {
        var stream = cloudinary_1.default.uploader.upload_stream({ folder: folderName }, function (error, result) {
            if (error)
                return reject(error);
            resolve({ url: result.secure_url, public_id: result.public_id });
        });
        stream.end(fileBuffer);
    });
};
// Helper function to format creation date as relative label
var formatRelativeTime = function (date) {
    var diffMs = Date.now() - date.getTime();
    var diffMins = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMins / 60);
    var diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1)
        return "now";
    if (diffMins < 60)
        return "".concat(diffMins, "m ago");
    if (diffHours < 24)
        return "".concat(diffHours, "h ago");
    return "".concat(diffDays, "d ago");
};
// @desc    Get all community posts
// @route   GET /api/community/posts
// @access  Private
var getCommunityPosts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, category, cursor, limit, status_1, authorId, qLimit, query, mappedTag, posts, hasNextPage, nextCursor, mappedPosts, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, category = _a.category, cursor = _a.cursor, limit = _a.limit, status_1 = _a.status, authorId = _a.authorId;
                qLimit = limit ? parseInt(limit, 10) : 20;
                query = { status: 'visible' };
                if (authorId) {
                    query.author = authorId;
                }
                if (category && category !== "all") {
                    mappedTag = category;
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
                return [4 /*yield*/, community_post_model_1.default.find(query)
                        .populate("author", "name role")
                        .populate("linkedDiagnosis", "diseaseNameEn confidence severity")
                        .sort({ createdAt: -1, _id: -1 })
                        .limit(qLimit + 1)];
            case 1:
                posts = _b.sent();
                hasNextPage = posts.length > qLimit;
                if (hasNextPage)
                    posts.pop();
                nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;
                mappedPosts = posts.map(function (p) {
                    var _a, _b, _c, _d, _e, _f, _g;
                    return ({
                        id: p._id,
                        author: p.author,
                        authorName: p.authorName,
                        authorRole: (_b = (_a = p.author) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : "farmer",
                        plantTag: p.plantTag,
                        title: p.title,
                        content: p.content,
                        timeLabel: formatRelativeTime(p.createdAt),
                        likes: p.likes,
                        comments: p.commentsCount,
                        imagePath: p.imagePath,
                        liked: p.likedBy.includes(req.user.id),
                        linkedDiagnosisId: (_d = (_c = p.linkedDiagnosis) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString(),
                        diagnosisDisease: (_e = p.linkedDiagnosis) === null || _e === void 0 ? void 0 : _e.diseaseNameEn,
                        diagnosisConfidence: (_f = p.linkedDiagnosis) === null || _f === void 0 ? void 0 : _f.confidence,
                        diagnosisSeverity: (_g = p.linkedDiagnosis) === null || _g === void 0 ? void 0 : _g.severity,
                    });
                });
                res.status(200).json({
                    success: true,
                    count: mappedPosts.length, // legacy
                    posts: mappedPosts, // legacy
                    data: {
                        items: mappedPosts,
                        pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor }
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                logger_1.logger.error('Failed to fetch posts', { event: 'community_feed_and_moderation.list_posts.error', error: error_1 });
                res.status(500).json({ message: "Failed to fetch posts" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getCommunityPosts = getCommunityPosts;
// @desc    Create a community post
// @route   POST /api/community/posts
// @access  Private
var createPost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, username, _a, title, content, plantTag, clientOperationId, linkedDiagnosisId, existing, imageUrl, imagePublicId, uploadResult, post, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                userId = req.user.id;
                username = req.user.name;
                _a = req.body, title = _a.title, content = _a.content, plantTag = _a.plantTag, clientOperationId = _a.clientOperationId, linkedDiagnosisId = _a.linkedDiagnosisId;
                if (!clientOperationId) return [3 /*break*/, 2];
                return [4 /*yield*/, community_post_model_1.default.findOne({ author: userId, clientOperationId: clientOperationId })];
            case 1:
                existing = _b.sent();
                if (existing) {
                    return [2 /*return*/, res.status(201).json({
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
                        })];
                }
                _b.label = 2;
            case 2:
                imageUrl = "";
                imagePublicId = "";
                if (!req.file) return [3 /*break*/, 4];
                return [4 /*yield*/, uploadToCloudinary(req.file.buffer, "community_posts")];
            case 3:
                uploadResult = _b.sent();
                imageUrl = uploadResult.url;
                imagePublicId = uploadResult.public_id;
                _b.label = 4;
            case 4: return [4 /*yield*/, community_post_model_1.default.create({
                    author: userId,
                    authorName: username,
                    plantTag: plantTag,
                    title: title.trim(),
                    content: content.trim(),
                    imagePath: imageUrl,
                    imagePublicId: imagePublicId,
                    clientOperationId: clientOperationId,
                    linkedDiagnosis: linkedDiagnosisId || undefined,
                })];
            case 5:
                post = _b.sent();
                logger_1.logger.info('Created community post', {
                    event: 'community_feed_and_moderation.create_post',
                    requestId: req.id,
                    actorId: userId,
                    targetId: post._id,
                    payload: { title: post.title.substring(0, 50), plantTag: plantTag }
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
                    data: { post: post }
                });
                return [3 /*break*/, 7];
            case 6:
                error_2 = _b.sent();
                if (error_2.code === 11000) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' })];
                }
                logger_1.logger.error('Failed to create post', { event: 'community_feed_and_moderation.create_post.error', error: error_2 });
                res.status(500).json({ message: "Failed to create post" });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createPost = createPost;
// @desc    Toggle post like status
// @route   POST /api/community/posts/:id/like
// @access  Private
var toggleLike = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, postId, post, hasLiked, liked, updatedPost, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                userId = req.user.id;
                postId = req.params.id;
                return [4 /*yield*/, community_post_model_1.default.findOne({ _id: postId, status: 'visible' })];
            case 1:
                post = _a.sent();
                if (!post) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Post not found", code: 'RESOURCE_NOT_FOUND' })];
                }
                hasLiked = post.likedBy.includes(userId);
                liked = false;
                if (!hasLiked) return [3 /*break*/, 3];
                // Unlike atomically
                return [4 /*yield*/, community_post_model_1.default.updateOne({ _id: postId }, {
                        $pull: { likedBy: userId },
                        $inc: { likes: -1 }
                    })];
            case 2:
                // Unlike atomically
                _a.sent();
                return [3 /*break*/, 5];
            case 3: 
            // Like atomically
            return [4 /*yield*/, community_post_model_1.default.updateOne({ _id: postId }, {
                    $addToSet: { likedBy: userId },
                    $inc: { likes: 1 }
                })];
            case 4:
                // Like atomically
                _a.sent();
                liked = true;
                _a.label = 5;
            case 5: return [4 /*yield*/, community_post_model_1.default.findById(postId)];
            case 6:
                updatedPost = _a.sent();
                logger_1.logger.info("User ".concat(liked ? 'liked' : 'unliked', " post"), {
                    event: 'community_feed_and_moderation.toggle_like',
                    requestId: req.id,
                    actorId: userId,
                    targetId: postId,
                    result: liked ? 'liked' : 'unliked'
                });
                res.status(200).json({
                    success: true,
                    likes: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.likes) || 0,
                    liked: liked,
                    data: { liked: liked, likes: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.likes) || 0 }
                });
                return [3 /*break*/, 8];
            case 7:
                error_3 = _a.sent();
                logger_1.logger.error('Failed to toggle like', { event: 'community_feed_and_moderation.toggle_like.error', error: error_3 });
                res.status(500).json({ message: "Failed to toggle like" });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.toggleLike = toggleLike;
// @desc    Get comments of a post
// @route   GET /api/community/posts/:id/comments
// @access  Private
var getComments = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, cursor, limit, qLimit, query, comments, seedComments, hasNextPage, nextCursor, mappedComments, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.query, cursor = _a.cursor, limit = _a.limit;
                qLimit = limit ? parseInt(limit, 10) : 50;
                query = { post: req.params.id, status: 'visible' };
                if (cursor) {
                    query._id = { $lt: cursor };
                }
                return [4 /*yield*/, comment_model_1.default.find(query)
                        .sort({ createdAt: -1, _id: -1 })
                        .populate('author', 'role')
                        .limit(qLimit + 1)];
            case 1:
                comments = _b.sent();
                if (!(comments.length === 0 && !cursor && (req.params.id === "p1" || req.params.id === "p2"))) return [3 /*break*/, 3];
                seedComments = [
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
                return [4 /*yield*/, comment_model_1.default.create(seedComments)];
            case 2:
                _b.sent();
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        comments: seedComments.map(function (c, idx) { return ({
                            id: "seeded_".concat(idx),
                            authorName: c.authorName,
                            text: c.text,
                            timeLabel: "now",
                        }); }),
                        data: { items: seedComments, pageInfo: { hasNextPage: false, nextCursor: null } }
                    })];
            case 3:
                hasNextPage = comments.length > qLimit;
                if (hasNextPage)
                    comments.pop();
                nextCursor = comments.length > 0 ? comments[comments.length - 1]._id : null;
                mappedComments = comments.map(function (c) {
                    var _a, _b;
                    return ({
                        id: c._id,
                        authorName: c.authorName,
                        authorRole: (_b = (_a = c.author) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : 'user',
                        text: c.text,
                        timeLabel: formatRelativeTime(c.createdAt),
                    });
                });
                res.status(200).json({
                    success: true,
                    comments: mappedComments, // legacy
                    data: {
                        items: mappedComments,
                        pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor }
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _b.sent();
                logger_1.logger.error('Failed to fetch comments', { event: 'community_feed_and_moderation.list_comments.error', error: error_4 });
                res.status(500).json({ message: "Failed to fetch comments" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getComments = getComments;
// @desc    Add a comment
// @route   POST /api/community/posts/:id/comments
// @access  Private
var createComment = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, username, _a, text, clientOperationId, postId, existing, post, comment, error_5;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 6, , 7]);
                userId = req.user.id;
                username = req.user.name;
                _a = req.body, text = _a.text, clientOperationId = _a.clientOperationId;
                postId = req.params.id;
                if (!clientOperationId) return [3 /*break*/, 2];
                return [4 /*yield*/, comment_model_1.default.findOne({ author: userId, post: postId, clientOperationId: clientOperationId })];
            case 1:
                existing = _c.sent();
                if (existing) {
                    return [2 /*return*/, res.status(201).json({
                            success: true,
                            comment: {
                                id: existing._id,
                                authorName: existing.authorName,
                                text: existing.text,
                                timeLabel: formatRelativeTime(existing.createdAt),
                            },
                            data: { comment: existing }
                        })];
                }
                _c.label = 2;
            case 2: return [4 /*yield*/, community_post_model_1.default.findOne({ _id: postId, status: 'visible' })];
            case 3:
                post = _c.sent();
                if (!post) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Post not found or unavailable", code: 'RESOURCE_NOT_FOUND' })];
                }
                return [4 /*yield*/, comment_model_1.default.create({
                        post: post._id,
                        author: userId,
                        authorName: username,
                        text: text.trim(),
                        clientOperationId: clientOperationId,
                    })];
            case 4:
                comment = _c.sent();
                // Atomically increment comment count
                return [4 /*yield*/, community_post_model_1.default.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } })];
            case 5:
                // Atomically increment comment count
                _c.sent();
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
                        authorRole: (_b = req.user.role) !== null && _b !== void 0 ? _b : 'user',
                        text: comment.text,
                        timeLabel: "now",
                    },
                    data: { comment: comment }
                });
                return [3 /*break*/, 7];
            case 6:
                error_5 = _c.sent();
                if (error_5.code === 11000) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' })];
                }
                if (error_5.name === 'ValidationError') {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error_5.message }))];
                }
                logger_1.logger.error('Failed to create comment', { event: 'community_feed_and_moderation.create_comment.error', error: error_5 });
                next(error_5);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createComment = createComment;
// @desc    Delete a community post
// @route   DELETE /api/community/posts/:id
// @access  Private
var deletePost = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, postId, post, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                postId = req.params.id;
                return [4 /*yield*/, community_post_model_1.default.findOne({ _id: postId })];
            case 1:
                post = _a.sent();
                if (!post) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Post not found", code: 'RESOURCE_NOT_FOUND' })];
                }
                if (post.author.toString() !== userId) {
                    return [2 /*return*/, res.status(403).json({ success: false, message: "Not authorized to delete this post", code: 'FORBIDDEN' })];
                }
                return [4 /*yield*/, community_post_model_1.default.updateOne({ _id: postId }, { status: 'removed' })];
            case 2:
                _a.sent();
                logger_1.logger.info('User deleted community post', {
                    event: 'community_feed_and_moderation.delete_post',
                    requestId: req.id,
                    actorId: userId,
                    targetId: postId,
                });
                res.status(200).json({ success: true, message: "Post deleted successfully" });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                logger_1.logger.error('Failed to delete post', { event: 'community_feed_and_moderation.delete_post.error', error: error_6 });
                res.status(500).json({ message: "Failed to delete post" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deletePost = deletePost;
