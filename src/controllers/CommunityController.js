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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityController = void 0;
var CommunityService_1 = require("../services/CommunityService");
var PostRepository_1 = require("../repositories/PostRepository");
var CommunityController = /** @class */ (function () {
    function CommunityController() {
        var _this = this;
        this.createPost = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, content, imageUrl, post, err_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = req.user._id || req.user.userId;
                        content = req.body.content;
                        imageUrl = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
                        return [4 /*yield*/, this.communityService.createPost(userId, content, imageUrl)];
                    case 1:
                        post = _b.sent();
                        res.status(201).json({ status: 'success', data: post });
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _b.sent();
                        res.status(400).json({ status: 'error', message: err_1.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.getPosts = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var page, limit, data, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        page = parseInt(req.query.page) || 1;
                        limit = parseInt(req.query.limit) || 10;
                        return [4 /*yield*/, this.communityService.getPosts(page, limit)];
                    case 1:
                        data = _a.sent();
                        res.status(200).json({ status: 'success', data: data });
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_2.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.deletePost = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, rawId, id, post, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = req.user._id || req.user.userId;
                        rawId = req.params.id;
                        id = Array.isArray(rawId) ? rawId[0] : rawId;
                        return [4 /*yield*/, this.postRepo.findById(id)];
                    case 1:
                        post = _a.sent();
                        if (!post || post.author.toString() !== userId.toString()) {
                            res.status(403).json({ status: 'error', message: 'Unauthorized' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.postRepo.softDelete(id)];
                    case 2:
                        _a.sent();
                        res.status(200).json({ status: 'success', message: 'Post deleted' });
                        return [3 /*break*/, 4];
                    case 3:
                        err_3 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_3.message });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.toggleLike = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, result, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user._id || req.user.userId;
                        id = req.params.id;
                        return [4 /*yield*/, this.communityService.toggleLike(userId, id)];
                    case 1:
                        result = _a.sent();
                        res.status(200).json({ status: 'success', data: result });
                        return [3 /*break*/, 3];
                    case 2:
                        err_4 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_4.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.addComment = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, content, comment, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user._id || req.user.userId;
                        id = req.params.id;
                        content = req.body.content;
                        return [4 /*yield*/, this.communityService.addComment(userId, id, content)];
                    case 1:
                        comment = _a.sent();
                        res.status(201).json({ status: 'success', data: comment });
                        return [3 /*break*/, 3];
                    case 2:
                        err_5 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_5.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.getComments = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, comments, err_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, this.communityService.getComments(id)];
                    case 1:
                        comments = _a.sent();
                        res.status(200).json({ status: 'success', data: comments });
                        return [3 /*break*/, 3];
                    case 2:
                        err_6 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_6.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.updatePost = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, data, post, err_7;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = req.user._id || req.user.userId;
                        id = req.params.id;
                        data = {
                            content: req.body.content,
                            imagePath: (_a = req.file) === null || _a === void 0 ? void 0 : _a.path
                        };
                        return [4 /*yield*/, this.communityService.updatePost(userId, id, data)];
                    case 1:
                        post = _b.sent();
                        if (!post) {
                            return [2 /*return*/, res.status(404).json({ status: 'error', message: 'Post not found or unauthorized' })];
                        }
                        res.status(200).json({ status: 'success', data: post });
                        return [3 /*break*/, 3];
                    case 2:
                        err_7 = _b.sent();
                        res.status(400).json({ status: 'error', message: err_7.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.updateComment = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, commentId, content, comment, err_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user._id || req.user.userId;
                        commentId = req.params.commentId;
                        content = req.body.content;
                        return [4 /*yield*/, this.communityService.updateComment(userId, commentId, content)];
                    case 1:
                        comment = _a.sent();
                        if (!comment) {
                            return [2 /*return*/, res.status(404).json({ status: 'error', message: 'Comment not found or unauthorized' })];
                        }
                        res.status(200).json({ status: 'success', data: comment });
                        return [3 /*break*/, 3];
                    case 2:
                        err_8 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_8.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.deleteComment = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, commentId, success, err_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user._id || req.user.userId;
                        commentId = req.params.commentId;
                        return [4 /*yield*/, this.communityService.deleteComment(userId, commentId)];
                    case 1:
                        success = _a.sent();
                        if (!success) {
                            return [2 /*return*/, res.status(404).json({ status: 'error', message: 'Comment not found or unauthorized' })];
                        }
                        res.status(200).json({ status: 'success', message: 'Comment deleted' });
                        return [3 /*break*/, 3];
                    case 2:
                        err_9 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_9.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.communityService = new CommunityService_1.CommunityService();
        this.postRepo = new PostRepository_1.PostRepository();
    }
    return CommunityController;
}());
exports.CommunityController = CommunityController;
