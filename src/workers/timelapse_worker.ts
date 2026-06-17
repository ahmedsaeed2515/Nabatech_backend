import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { TimelapseJobRepository } from '../repositories/TimelapseJobRepository';
import GrowthMeasurementModel from '../models/growth_measurement_model';
import { TimelapseJobStatus } from '../models/timelapse_job_model';
import { logger } from '../utils/logger';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export let timelapseWorker: Worker | null = null;

const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  timelapseWorker = new Worker('timelapse.generate', async (job) => {
  const { jobId, plantId } = job.data;
  const jobRepo = new TimelapseJobRepository();

  try {
    // 1. Mark as processing
    await jobRepo.update(jobId, { status: TimelapseJobStatus.PROCESSING });

    // 2. Fetch photos
    const measurements = await GrowthMeasurementModel.find({ plant: plantId, photoUrl: { $ne: null } }).sort({ createdAt: 1 }).exec();
    if (measurements.length === 0) {
      throw new Error('No photos found for this plant.');
    }

    // 3. Download images to temp directory
    const tempDir = path.join(__dirname, `../../tmp/timelapse_${jobId}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const imagePaths: string[] = [];
    let concatList = '';
    
    for (let i = 0; i < measurements.length; i++) {
      const photoUrl = measurements[i].photoUrl;
      if (!photoUrl) continue;
      
      const ext = path.extname(new URL(photoUrl).pathname) || '.jpg';
      const imgFileName = `img_${String(i).padStart(4, '0')}${ext}`;
      const imgPath = path.join(tempDir, imgFileName);
      
      const response = await axios.get(photoUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(imgPath);
      (response.data as any).pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      imagePaths.push(imgPath);
      concatList += `file '${imgFileName}'\n`;
    }

    // Write the concat list file
    const concatFilePath = path.join(tempDir, 'input.txt');
    fs.writeFileSync(concatFilePath, concatList);

    // 4. Run FFmpeg using concat demuxer
    const outputPath = path.join(tempDir, 'output.mp4');
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-r 2', '-pix_fmt yuv420p'])
        .output(outputPath)
        .videoCodec('libx264')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // 5. Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(outputPath, {
      resource_type: 'video',
      folder: 'timelapses'
    });

    // 6. Update DB
    await jobRepo.update(jobId, {
      status: TimelapseJobStatus.DONE,
      videoUrl: uploadResult.secure_url
    });

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });

  } catch (err: any) {
    logger.error(`Timelapse generation failed for job ${jobId}:`, err);
    await jobRepo.update(jobId, {
      status: TimelapseJobStatus.FAILED,
      errorLog: err.message || 'Unknown error'
    });
  }
  }, { connection: connection as any });

  timelapseWorker.on('completed', job => {
    logger.info(`Timelapse job completed: ${job.id}`);
  });

  timelapseWorker.on('failed', (job, err) => {
    logger.error(`Timelapse job failed: ${job?.id}`, err);
  });
} else {
  logger.warn('Redis unavailable – timelapse worker disabled (serverless mode).');
}
