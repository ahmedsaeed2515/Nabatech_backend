"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const TimelapseJobRepository_1 = require("../repositories/TimelapseJobRepository");
const timelapse_queue_1 = require("../queues/timelapse_queue");
class MediaService {
    constructor() {
        this.jobRepo = new TimelapseJobRepository_1.TimelapseJobRepository();
    }
    async requestTimelapse(userId, plantId) {
        // 1. Create a job in DB
        const job = await this.jobRepo.create({
            user: userId,
            plant: plantId,
        });
        // 2. Queue the job
        await timelapse_queue_1.timelapseQueue?.add('generate', {
            jobId: job._id.toString(),
            plantId,
            userId
        });
        return job;
    }
    async getTimelapseJobs(userId) {
        return this.jobRepo.findByUser(userId);
    }
}
exports.MediaService = MediaService;
