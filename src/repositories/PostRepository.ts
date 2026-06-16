import { BaseRepository } from './BaseRepository';
import PostModel, { Post } from '../models/post_model';

export class PostRepository extends BaseRepository<Post> {
  constructor() {
    super(PostModel);
  }

  async findPaginated(skip: number, limit: number): Promise<Post[]> {
    return this.model.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'email level')
      .exec();
  }

  async countAll(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async incrementLikes(postId: string): Promise<void> {
    await this.model.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }).exec();
  }

  async decrementLikes(postId: string): Promise<void> {
    await this.model.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }).exec();
  }
}
