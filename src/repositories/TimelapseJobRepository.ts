import { BaseRepository } from './BaseRepository';
import TimelapseJobModel, { TimelapseJob } from '../models/timelapse_job_model';

export class TimelapseJobRepository extends BaseRepository<TimelapseJob> {
  constructor() {
    super(TimelapseJobModel);
  }

  async findByUser(userId: string): Promise<TimelapseJob[]> {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  async findByPlant(plantId: string): Promise<TimelapseJob[]> {
    return this.model.find({ plant: plantId }).sort({ createdAt: -1 }).exec();
  }
}
