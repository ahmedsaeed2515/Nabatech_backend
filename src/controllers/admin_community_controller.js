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
exports.adminModerateComment = exports.adminGetComments = exports.adminResolvePost = exports.adminModeratePost = exports.adminGetPosts = void 0;
var community_post_model_1 = __importDefault(require("../models/community_post_model"));
var comment_model_1 = __importDefault(require("../models/comment_model"));
var logger_1 = require("../utils/logger");
var adminGetPosts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, cursor, limit, status_1, authorId, qLimit, query, posts, hasNextPage, nextCursor, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, cursor = _a.cursor, limit = _a.limit, status_1 = _a.status, authorId = _a.authorId;
                qLimit = limit ? parseInt(limit, 10) : 20;
                query = {};
                if (status_1 && status_1 !== 'all')
                    query.status = status_1;
                if (authorId)
                    query.author = authorId;
                if (cursor)
                    query._id = { $lt: cursor };
                return [4 /*yield*/, community_post_model_1.default.find(query)
                        .sort({ _id: -1 })
                        .limit(qLimit + 1)
                        .populate('author', 'name email role accountType')];
            case 1:
                posts = _b.sent();
                hasNextPage = posts.length > qLimit;
                if (hasNextPage)
                    posts.pop();
                nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;
                logger_1.logger.info('Admin retrieved community posts', { event: 'community_feed_and_moderation.admin_list_posts', requestId: req.id, limit: qLimit, count: posts.length });
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: posts,
                            pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor }
                        }
                    })];
            case 2:
                error_1 = _b.sent();
                logger_1.logger.error('Failed to list community posts for admin', { event: 'community_feed_and_moderation.admin_list_posts.error', error: error_1 });
                return [2 /*return*/, res.status(500).json({ message: 'Internal server error' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.adminGetPosts = adminGetPosts;
var adminModeratePost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, action, reason, version, adminId, post, newStatus, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.body, action = _a.action, reason = _a.reason, version = _a.version;
                adminId = req.user.id;
                return [4 /*yield*/, community_post_model_1.default.findById(id)];
            case 1:
                post = _b.sent();
                if (!post) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' })];
                }
                if (post.version !== version) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' })];
                }
                newStatus = action === 'approve' || action === 'restore' ? 'visible' : action === 'hide' ? 'hidden' : 'removed';
                post.status = newStatus;
                post.moderationReason = reason || '';
                post.moderatedBy = adminId;
                post.moderatedAt = new Date();
                post.version += 1;
                return [4 /*yield*/, post.save()];
            case 2:
                _b.sent();
                logger_1.logger.info("Admin moderated post ".concat(id), {
                    event: 'community_feed_and_moderation.admin_moderate_post',
                    requestId: req.id,
                    actorId: adminId,
                    targetId: id,
                    action: action,
                    newStatus: newStatus
                });
                return [2 /*return*/, res.status(200).json({ success: true, data: { post: post } })];
            case 3:
                error_2 = _b.sent();
                logger_1.logger.error('Failed to moderate post', { event: 'community_feed_and_moderation.admin_moderate_post.error', error: error_2 });
                return [2 /*return*/, res.status(500).json({ message: 'Internal server error' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.adminModeratePost = adminModeratePost;
var adminResolvePost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, adminId, post, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                adminId = req.user.id;
                return [4 /*yield*/, community_post_model_1.default.findById(id)];
            case 1:
                post = _a.sent();
                if (!post) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' })];
                }
                post.status = 'resolved';
                post.moderationNotes = 'Admin intervened';
                post.moderatedBy = adminId;
                post.moderatedAt = new Date();
                post.version += 1;
                return [4 /*yield*/, post.save()];
            case 2:
                _a.sent();
                logger_1.logger.info("Admin resolved post ".concat(id), {
                    event: 'community_feed_and_moderation.admin_resolve_post',
                    requestId: req.id,
                    actorId: adminId,
                    targetId: id
                });
                return [2 /*return*/, res.status(200).json({ success: true, data: { post: post } })];
            case 3:
                error_3 = _a.sent();
                logger_1.logger.error('Failed to resolve post', { event: 'community_feed_and_moderation.admin_resolve_post.error', error: error_3 });
                return [2 /*return*/, res.status(500).json({ message: 'Internal server error' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.adminResolvePost = adminResolvePost;
var adminGetComments = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, cursor, limit, status_2, authorId, postId, qLimit, query, comments, hasNextPage, nextCursor, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, cursor = _a.cursor, limit = _a.limit, status_2 = _a.status, authorId = _a.authorId, postId = _a.postId;
                qLimit = limit ? parseInt(limit, 10) : 20;
                query = {};
                if (status_2 && status_2 !== 'all')
                    query.status = status_2;
                if (authorId)
                    query.author = authorId;
                if (postId)
                    query.post = postId;
                if (cursor)
                    query._id = { $lt: cursor };
                return [4 /*yield*/, comment_model_1.default.find(query)
                        .sort({ _id: -1 })
                        .limit(qLimit + 1)
                        .populate('author', 'name email role')];
            case 1:
                comments = _b.sent();
                hasNextPage = comments.length > qLimit;
                if (hasNextPage)
                    comments.pop();
                nextCursor = comments.length > 0 ? comments[comments.length - 1]._id : null;
                logger_1.logger.info('Admin retrieved community comments', { event: 'community_feed_and_moderation.admin_list_comments', requestId: req.id, limit: qLimit, count: comments.length });
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: comments,
                            pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor }
                        }
                    })];
            case 2:
                error_4 = _b.sent();
                logger_1.logger.error('Failed to list community comments for admin', { event: 'community_feed_and_moderation.admin_list_comments.error', error: error_4 });
                return [2 /*return*/, res.status(500).json({ message: 'Internal server error' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.adminGetComments = adminGetComments;
var adminModerateComment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, action, reason, version, adminId, comment, newStatus, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.body, action = _a.action, reason = _a.reason, version = _a.version;
                adminId = req.user.id;
                return [4 /*yield*/, comment_model_1.default.findById(id)];
            case 1:
                comment = _b.sent();
                if (!comment) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Comment not found', code: 'RESOURCE_NOT_FOUND' })];
                }
                if (comment.version !== version) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' })];
                }
                newStatus = action === 'approve' || action === 'restore' ? 'visible' : action === 'hide' ? 'hidden' : 'removed';
                comment.status = newStatus;
                comment.moderationReason = reason || '';
                comment.moderatedBy = adminId;
                comment.moderatedAt = new Date();
                comment.version += 1;
                return [4 /*yield*/, comment.save()];
            case 2:
                _b.sent();
                logger_1.logger.info("Admin moderated comment ".concat(id), {
                    event: 'community_feed_and_moderation.admin_moderate_comment',
                    requestId: req.id,
                    actorId: adminId,
                    targetId: id,
                    action: action,
                    newStatus: newStatus
                });
                return [2 /*return*/, res.status(200).json({ success: true, data: { comment: comment } })];
            case 3:
                error_5 = _b.sent();
                logger_1.logger.error('Failed to moderate comment', { event: 'community_feed_and_moderation.admin_moderate_comment.error', error: error_5 });
                return [2 /*return*/, res.status(500).json({ message: 'Internal server error' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.adminModerateComment = adminModerateComment;
