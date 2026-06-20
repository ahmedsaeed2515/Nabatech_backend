"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityController = void 0;
const CommunityService_1 = require("../services/CommunityService");
const PostRepository_1 = require("../repositories/PostRepository");
class CommunityController {
    constructor() {
        this.createPost = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { content } = req.body;
                const imageUrl = req.file?.path; // If multer is used
                const post = await this.communityService.createPost(userId, content, imageUrl);
                res.status(201).json({ status: 'success', data: post });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getPosts = async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const data = await this.communityService.getPosts(page, limit);
                res.status(200).json({ status: 'success', data });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deletePost = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { id: rawId } = req.params;
                const id = Array.isArray(rawId) ? rawId[0] : rawId;
                const post = await this.postRepo.findById(id);
                if (!post || post.author.toString() !== userId.toString()) {
                    res.status(403).json({ status: 'error', message: 'Unauthorized' });
                    return;
                }
                await this.postRepo.softDelete(id);
                res.status(200).json({ status: 'success', message: 'Post deleted' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.toggleLike = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const id = req.params.id;
                const result = await this.communityService.toggleLike(userId, id);
                res.status(200).json({ status: 'success', data: result });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.addComment = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const id = req.params.id;
                const { content } = req.body;
                const comment = await this.communityService.addComment(userId, id, content);
                res.status(201).json({ status: 'success', data: comment });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getComments = async (req, res) => {
            try {
                const id = req.params.id;
                const comments = await this.communityService.getComments(id);
                res.status(200).json({ status: 'success', data: comments });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updatePost = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const id = req.params.id;
                const data = {
                    content: req.body.content,
                    imagePath: req.file?.path
                };
                const post = await this.communityService.updatePost(userId, id, data);
                if (!post) {
                    return res.status(404).json({ status: 'error', message: 'Post not found or unauthorized' });
                }
                res.status(200).json({ status: 'success', data: post });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updateComment = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const commentId = req.params.commentId;
                const { content } = req.body;
                const comment = await this.communityService.updateComment(userId, commentId, content);
                if (!comment) {
                    return res.status(404).json({ status: 'error', message: 'Comment not found or unauthorized' });
                }
                res.status(200).json({ status: 'success', data: comment });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deleteComment = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const commentId = req.params.commentId;
                const success = await this.communityService.deleteComment(userId, commentId);
                if (!success) {
                    return res.status(404).json({ status: 'error', message: 'Comment not found or unauthorized' });
                }
                res.status(200).json({ status: 'success', message: 'Comment deleted' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.communityService = new CommunityService_1.CommunityService();
        this.postRepo = new PostRepository_1.PostRepository();
    }
}
exports.CommunityController = CommunityController;
