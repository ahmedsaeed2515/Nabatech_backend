import { Request, Response } from 'express';
import { CommunityService } from '../services/CommunityService';
import { PostRepository } from '../repositories/PostRepository';

export class CommunityController {
  private communityService: CommunityService;
  private postRepo: PostRepository;

  constructor() {
    this.communityService = new CommunityService();
    this.postRepo = new PostRepository();
  }

  createPost = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { content } = req.body;
      const imageUrl = req.file?.path; // If multer is used

      const post = await this.communityService.createPost(userId, content, imageUrl);
      res.status(201).json({ status: 'success', data: post });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getPosts = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const data = await this.communityService.getPosts(page, limit);
      res.status(200).json({ status: 'success', data });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { id: rawId } = req.params;
const id = Array.isArray(rawId) ? rawId[0] : rawId;

      const post = await this.postRepo.findById(id);
      if (!post || post.author.toString() !== userId.toString()) {
        res.status(403).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await this.postRepo.softDelete(id);
      res.status(200).json({ status: 'success', message: 'Post deleted' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  toggleLike = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const id = req.params.id as string;

      const result = await this.communityService.toggleLike(userId, id);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  addComment = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const id = req.params.id as string;
      const { content } = req.body;

      const comment = await this.communityService.addComment(userId, id, content);
      res.status(201).json({ status: 'success', data: comment });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getComments = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const comments = await this.communityService.getComments(id);
      res.status(200).json({ status: 'success', data: comments });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  updatePost = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const id = req.params.id as string;
      const data = {
        content: req.body.content,
        imagePath: req.file?.path
      };
      
      const post = await this.communityService.updatePost(userId, id, data);
      if (!post) {
        return res.status(404).json({ status: 'error', message: 'Post not found or unauthorized' });
      }
      res.status(200).json({ status: 'success', data: post });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  updateComment = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const commentId = req.params.commentId as string;
      const { content } = req.body;
      
      const comment = await this.communityService.updateComment(userId, commentId, content);
      if (!comment) {
        return res.status(404).json({ status: 'error', message: 'Comment not found or unauthorized' });
      }
      res.status(200).json({ status: 'success', data: comment });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deleteComment = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const commentId = req.params.commentId as string;
      
      const success = await this.communityService.deleteComment(userId, commentId);
      if (!success) {
        return res.status(404).json({ status: 'error', message: 'Comment not found or unauthorized' });
      }
      res.status(200).json({ status: 'success', message: 'Comment deleted' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


