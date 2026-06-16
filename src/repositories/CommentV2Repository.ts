import { BaseRepository } from './BaseRepository';
import CommentV2Model, { CommentV2 } from '../models/comment_v2_model';

export class CommentV2Repository extends BaseRepository<CommentV2> {
  constructor() {
    super(CommentV2Model);
  }

  async findByPostId(postId: string): Promise<CommentV2[]> {
    return this.model.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('user', 'email level')
      .exec();
  }
}
