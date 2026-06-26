import { BaseRepository } from './BaseRepository';
import AiReportModel, { AiReport } from '../models/ai_report_model';

export class AiReportRepository extends BaseRepository<AiReport> {
  constructor() {
    super(AiReportModel);
  }

  async findByUserId(userId: string): Promise<AiReport[]> {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }
}


