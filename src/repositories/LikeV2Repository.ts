import { BaseRepository } from './BaseRepository';
import LikeV2Model, { LikeV2 } from '../models/like_v2_model';

export class LikeV2Repository extends BaseRepository<LikeV2> {
  constructor() {
    super(LikeV2Model);
  }

  async findByUserAndPost(userId: string, postId: string): Promise<LikeV2 | null> {
    return this.model.findOne({ user: userId, post: postId }).exec();
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    await this.model.deleteOne({ user: userId, post: postId }).exec();
  }
}
