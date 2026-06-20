"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const PostRepository_1 = require("../repositories/PostRepository");
const CommentV2Repository_1 = require("../repositories/CommentV2Repository");
const LikeV2Repository_1 = require("../repositories/LikeV2Repository");
const NotificationService_1 = require("./NotificationService");
const UserRepository_1 = require("../repositories/UserRepository");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
class CommunityService {
    constructor() {
        this.postRepo = new PostRepository_1.PostRepository();
        this.commentRepo = new CommentV2Repository_1.CommentV2Repository();
        this.likeRepo = new LikeV2Repository_1.LikeV2Repository();
        this.notificationService = new NotificationService_1.NotificationService();
        this.userRepo = new UserRepository_1.UserRepository();
    }
    async createPost(userId, content, imageUrl, plantTag = 'General', title) {
        const user = await this.userRepo.findById(userId);
        const authorName = user?.name || user?.email || 'Unknown';
        return this.postRepo.create({
            author: new mongoose_1.default.Types.ObjectId(userId),
            authorName,
            plantTag,
            title: title || 'Community Post',
            content,
            imagePath: imageUrl,
            likes: 0,
            commentsCount: 0,
            likedBy: [],
            status: 'visible'
        });
    }
    async getPosts(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.postRepo.findPaginated(skip, limit),
            this.postRepo.countAll()
        ]);
        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async updatePost(userId, postId, data) {
        const post = await this.postRepo.findById(postId);
        if (!post || post.author.toString() !== userId)
            return null;
        return this.postRepo.update(postId, data);
    }
    async toggleLike(userId, postId) {
        // Start a transaction if needed, but since we are just toggling and relying on unique index, we can handle it robustly
        const existingLike = await this.likeRepo.findByUserAndPost(userId, postId);
        if (existingLike) {
            await this.likeRepo.deleteByUserAndPost(userId, postId);
            await this.postRepo.decrementLikes(postId);
            return { liked: false };
        }
        else {
            try {
                await this.likeRepo.create({
                    user: userId,
                    post: postId
                });
                await this.postRepo.incrementLikes(postId);
                return { liked: true };
            }
            catch (err) {
                if (err.code === 11000) {
                    // Concurrency: already liked
                    return { liked: true };
                }
                throw err;
            }
        }
    }
    async addComment(userId, postId, content) {
        const comment = await this.commentRepo.create({
            user: userId,
            post: postId,
            content
        });
        try {
            const post = await this.postRepo.findById(postId);
            if (post && post.author.toString() !== userId) {
                const postOwner = await this.userRepo.findById(post.author.toString());
                const commenter = await this.userRepo.findById(userId);
                if (postOwner && postOwner.fcmToken) {
                    // FIX [TASK-6.1]: Use user's real name instead of email
                    const commenterName = commenter?.name || commenter?.email?.split('@')[0] || 'Someone';
                    await this.notificationService.sendPushNotification(postOwner.fcmToken, {
                        notification: {
                            title: 'New Comment',
                            body: `${commenterName} commented on your post: "${content.substring(0, 50)}..."`
                        },
                        data: { type: 'NEW_COMMENT', postId: postId }
                    });
                }
            }
        }
        catch (err) {
            logger_1.logger.error(`Failed to send comment notification for post ${postId}`, err);
        }
        return comment;
    }
    async getComments(postId) {
        return this.commentRepo.findByPostId(postId);
    }
    async updateComment(userId, commentId, content) {
        const comment = await this.commentRepo.findById(commentId);
        if (!comment || comment.user.toString() !== userId)
            return null;
        return this.commentRepo.update(commentId, { content });
    }
    async deleteComment(userId, commentId) {
        const comment = await this.commentRepo.findById(commentId);
        if (!comment || comment.user.toString() !== userId)
            return false;
        await this.commentRepo.hardDelete(commentId);
        return true;
    }
}
exports.CommunityService = CommunityService;
