import { BaseRepository } from './BaseRepository';
import CommunityPostModel, { ICommunityPost } from '../models/community_post_model';

export class PostRepository extends BaseRepository<ICommunityPost> {
  constructor() {
    super(CommunityPostModel);
  }

  async findPaginated(skip: number, limit: number): Promise<ICommunityPost[]> {
    return this.model.find({ status: 'visible' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email level')
      .exec();
  }

  async countAll(): Promise<number> {
    return this.model.countDocuments({ status: 'visible' }).exec();
  }

  async incrementLikes(postId: string): Promise<void> {
    await this.model.findByIdAndUpdate(postId, { $inc: { likes: 1 } }).exec();
  }

  async decrementLikes(postId: string): Promise<void> {
    await this.model.findByIdAndUpdate(postId, { $inc: { likes: -1 } }).exec();
  }
}


