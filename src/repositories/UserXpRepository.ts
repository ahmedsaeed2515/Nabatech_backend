import { BaseRepository } from './BaseRepository';
import UserXpModel, { UserXp } from '../models/user_xp_model';

export class UserXpRepository extends BaseRepository<UserXp> {
  constructor() {
    super(UserXpModel);
  }

  async findByUserId(userId: string): Promise<UserXp | null> {
    return this.model.findOne({ user: userId }).exec();
  }
}
