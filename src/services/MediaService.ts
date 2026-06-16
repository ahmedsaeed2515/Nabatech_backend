import { TimelapseJobRepository } from '../repositories/TimelapseJobRepository';
import { timelapseQueue } from '../queues/timelapse_queue';

export class MediaService {
  private jobRepo: TimelapseJobRepository;

  constructor() {
    this.jobRepo = new TimelapseJobRepository();
  }

  async requestTimelapse(userId: string, plantId: string) {
    // 1. Create a job in DB
    const job = await this.jobRepo.create({
      user: userId as any,
      plant: plantId as any,
    });

    // 2. Queue the job
    await timelapseQueue.add('generate', {
      jobId: job._id.toString(),
      plantId,
      userId
    });

    return job;
  }

  async getTimelapseJobs(userId: string) {
    return this.jobRepo.findByUser(userId);
  }
}
