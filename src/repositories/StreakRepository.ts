import { BaseRepository } from './BaseRepository';
import StreakModel, { Streak } from '../models/streak_model';

export class StreakRepository extends BaseRepository<Streak> {
  constructor() {
    super(StreakModel);
  }

  async findByUserId(userId: string): Promise<Streak | null> {
    return this.model.findOne({ user: userId }).exec();
  }

  async resetStaleStreaks(staleThreshold: Date): Promise<void> {
    await this.model.updateMany(
      { lastActive: { $lt: staleThreshold } },
      { $set: { current: 0 } }
    ).exec();
  }
}
