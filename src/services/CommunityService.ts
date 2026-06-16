import { PostRepository } from '../repositories/PostRepository';
import { CommentV2Repository } from '../repositories/CommentV2Repository';
import { LikeV2Repository } from '../repositories/LikeV2Repository';
import { NotificationService } from './NotificationService';
import { UserRepository } from '../repositories/UserRepository';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export class CommunityService {
  private postRepo: PostRepository;
  private commentRepo: CommentV2Repository;
  private likeRepo: LikeV2Repository;
  private notificationService: NotificationService;
  private userRepo: UserRepository;

  constructor() {
    this.postRepo = new PostRepository();
    this.commentRepo = new CommentV2Repository();
    this.likeRepo = new LikeV2Repository();
    this.notificationService = new NotificationService();
    this.userRepo = new UserRepository();
  }

  async createPost(userId: string, content: string, imageUrl?: string) {
    return this.postRepo.create({
      user: userId as any,
      content,
      imageUrl
    });
  }

  async getPosts(page: number = 1, limit: number = 10) {
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

  async toggleLike(userId: string, postId: string) {
    // Start a transaction if needed, but since we are just toggling and relying on unique index, we can handle it robustly
    const existingLike = await this.likeRepo.findByUserAndPost(userId, postId);

    if (existingLike) {
      await this.likeRepo.deleteByUserAndPost(userId, postId);
      await this.postRepo.decrementLikes(postId);
      return { liked: false };
    } else {
      try {
        await this.likeRepo.create({
          user: userId as any,
          post: postId as any
        });
        await this.postRepo.incrementLikes(postId);
        return { liked: true };
      } catch (err: any) {
        if (err.code === 11000) {
          // Concurrency: already liked
          return { liked: true };
        }
        throw err;
      }
    }
  }

  async addComment(userId: string, postId: string, content: string) {
    const comment = await this.commentRepo.create({
      user: userId as any,
      post: postId as any,
      content
    });

    try {
      const post = await this.postRepo.findById(postId);
      if (post && post.user.toString() !== userId) {
        const postOwner = await this.userRepo.findById(post.user.toString());
        const commenter = await this.userRepo.findById(userId);
        
        if (postOwner && postOwner.fcmToken) {
          const commenterName = commenter?.email || 'Someone';
          await this.notificationService.sendPushNotification(
            postOwner.fcmToken,
            {
              notification: {
                title: 'New Comment',
                body: `${commenterName} commented on your post: "${content.substring(0, 50)}..."`
              },
              data: { type: 'NEW_COMMENT', postId: postId }
            }
          );
        }
      }
    } catch (err) {
      logger.error(`Failed to send comment notification for post ${postId}`, err);
    }

    return comment;
  }

  async getComments(postId: string) {
    return this.commentRepo.findByPostId(postId);
  }
}
