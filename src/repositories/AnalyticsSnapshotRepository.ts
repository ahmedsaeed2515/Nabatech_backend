import { BaseRepository } from './BaseRepository';
import AnalyticsSnapshotModel, { AnalyticsSnapshot } from '../models/analytics_snapshot_model';

export class AnalyticsSnapshotRepository extends BaseRepository<AnalyticsSnapshot> {
  constructor() {
    super(AnalyticsSnapshotModel);
  }

  async findByUserId(userId: string): Promise<AnalyticsSnapshot[]> {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }
}


