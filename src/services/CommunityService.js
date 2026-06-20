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
exports.CommunityService = void 0;
var PostRepository_1 = require("../repositories/PostRepository");
var CommentV2Repository_1 = require("../repositories/CommentV2Repository");
var LikeV2Repository_1 = require("../repositories/LikeV2Repository");
var NotificationService_1 = require("./NotificationService");
var UserRepository_1 = require("../repositories/UserRepository");
var mongoose_1 = __importDefault(require("mongoose"));
var logger_1 = require("../utils/logger");
var CommunityService = /** @class */ (function () {
    function CommunityService() {
        this.postRepo = new PostRepository_1.PostRepository();
        this.commentRepo = new CommentV2Repository_1.CommentV2Repository();
        this.likeRepo = new LikeV2Repository_1.LikeV2Repository();
        this.notificationService = new NotificationService_1.NotificationService();
        this.userRepo = new UserRepository_1.UserRepository();
    }
    CommunityService.prototype.createPost = function (userId_1, content_1, imageUrl_1) {
        return __awaiter(this, arguments, void 0, function (userId, content, imageUrl, plantTag, title) {
            var user, authorName;
            if (plantTag === void 0) { plantTag = 'General'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepo.findById(userId)];
                    case 1:
                        user = _a.sent();
                        authorName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email) || 'Unknown';
                        return [2 /*return*/, this.postRepo.create({
                                author: new mongoose_1.default.Types.ObjectId(userId),
                                authorName: authorName,
                                plantTag: plantTag,
                                title: title || 'Community Post',
                                content: content,
                                imagePath: imageUrl,
                                likes: 0,
                                commentsCount: 0,
                                likedBy: [],
                                status: 'visible'
                            })];
                }
            });
        });
    };
    CommunityService.prototype.getPosts = function () {
        return __awaiter(this, arguments, void 0, function (page, limit) {
            var skip, _a, posts, total;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        skip = (page - 1) * limit;
                        return [4 /*yield*/, Promise.all([
                                this.postRepo.findPaginated(skip, limit),
                                this.postRepo.countAll()
                            ])];
                    case 1:
                        _a = _b.sent(), posts = _a[0], total = _a[1];
                        return [2 /*return*/, {
                                posts: posts,
                                pagination: {
                                    page: page,
                                    limit: limit,
                                    total: total,
                                    pages: Math.ceil(total / limit)
                                }
                            }];
                }
            });
        });
    };
    CommunityService.prototype.updatePost = function (userId, postId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepo.findById(postId)];
                    case 1:
                        post = _a.sent();
                        if (!post || post.author.toString() !== userId)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.postRepo.update(postId, data)];
                }
            });
        });
    };
    CommunityService.prototype.toggleLike = function (userId, postId) {
        return __awaiter(this, void 0, void 0, function () {
            var existingLike, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.likeRepo.findByUserAndPost(userId, postId)];
                    case 1:
                        existingLike = _a.sent();
                        if (!existingLike) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.likeRepo.deleteByUserAndPost(userId, postId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.postRepo.decrementLikes(postId)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, { liked: false }];
                    case 4:
                        _a.trys.push([4, 7, , 8]);
                        return [4 /*yield*/, this.likeRepo.create({
                                user: userId,
                                post: postId
                            })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.postRepo.incrementLikes(postId)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, { liked: true }];
                    case 7:
                        err_1 = _a.sent();
                        if (err_1.code === 11000) {
                            // Concurrency: already liked
                            return [2 /*return*/, { liked: true }];
                        }
                        throw err_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CommunityService.prototype.addComment = function (userId, postId, content) {
        return __awaiter(this, void 0, void 0, function () {
            var comment, post, postOwner, commenter, commenterName, err_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.commentRepo.create({
                            user: userId,
                            post: postId,
                            content: content
                        })];
                    case 1:
                        comment = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 8, , 9]);
                        return [4 /*yield*/, this.postRepo.findById(postId)];
                    case 3:
                        post = _b.sent();
                        if (!(post && post.author.toString() !== userId)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.userRepo.findById(post.author.toString())];
                    case 4:
                        postOwner = _b.sent();
                        return [4 /*yield*/, this.userRepo.findById(userId)];
                    case 5:
                        commenter = _b.sent();
                        if (!(postOwner && postOwner.fcmToken)) return [3 /*break*/, 7];
                        commenterName = (commenter === null || commenter === void 0 ? void 0 : commenter.name) || ((_a = commenter === null || commenter === void 0 ? void 0 : commenter.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'Someone';
                        return [4 /*yield*/, this.notificationService.sendPushNotification(postOwner.fcmToken, {
                                notification: {
                                    title: 'New Comment',
                                    body: "".concat(commenterName, " commented on your post: \"").concat(content.substring(0, 50), "...\"")
                                },
                                data: { type: 'NEW_COMMENT', postId: postId }
                            })];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        err_2 = _b.sent();
                        logger_1.logger.error("Failed to send comment notification for post ".concat(postId), err_2);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, comment];
                }
            });
        });
    };
    CommunityService.prototype.getComments = function (postId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.commentRepo.findByPostId(postId)];
            });
        });
    };
    CommunityService.prototype.updateComment = function (userId, commentId, content) {
        return __awaiter(this, void 0, void 0, function () {
            var comment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.commentRepo.findById(commentId)];
                    case 1:
                        comment = _a.sent();
                        if (!comment || comment.user.toString() !== userId)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.commentRepo.update(commentId, { content: content })];
                }
            });
        });
    };
    CommunityService.prototype.deleteComment = function (userId, commentId) {
        return __awaiter(this, void 0, void 0, function () {
            var comment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.commentRepo.findById(commentId)];
                    case 1:
                        comment = _a.sent();
                        if (!comment || comment.user.toString() !== userId)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, this.commentRepo.hardDelete(commentId)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    return CommunityService;
}());
exports.CommunityService = CommunityService;
