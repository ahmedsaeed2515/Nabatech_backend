"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timelapseWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const TimelapseJobRepository_1 = require("../repositories/TimelapseJobRepository");
const growth_measurement_model_1 = __importDefault(require("../models/growth_measurement_model"));
const timelapse_job_model_1 = require("../models/timelapse_job_model");
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
exports.timelapseWorker = null;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    const connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    exports.timelapseWorker = new bullmq_1.Worker('timelapse.generate', async (job) => {
        const { jobId, plantId } = job.data;
        const jobRepo = new TimelapseJobRepository_1.TimelapseJobRepository();
        try {
            // 1. Mark as processing
            await jobRepo.update(jobId, { status: timelapse_job_model_1.TimelapseJobStatus.PROCESSING });
            // 2. Fetch photos
            const measurements = await growth_measurement_model_1.default.find({ plant: plantId, photoUrl: { $ne: null } }).sort({ createdAt: 1 }).exec();
            if (measurements.length === 0) {
                throw new Error('No photos found for this plant.');
            }
            // 3. Download images to temp directory
            const tempDir = path_1.default.join(__dirname, `../../tmp/timelapse_${jobId}`);
            if (!fs_1.default.existsSync(tempDir)) {
                fs_1.default.mkdirSync(tempDir, { recursive: true });
            }
            const imagePaths = [];
            let concatList = '';
            for (let i = 0; i < measurements.length; i++) {
                const photoUrl = measurements[i].photoUrl;
                if (!photoUrl)
                    continue;
                const ext = path_1.default.extname(new URL(photoUrl).pathname) || '.jpg';
                const imgFileName = `img_${String(i).padStart(4, '0')}${ext}`;
                const imgPath = path_1.default.join(tempDir, imgFileName);
                const response = await axios_1.default.get(photoUrl, { responseType: 'stream' });
                const writer = fs_1.default.createWriteStream(imgPath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                imagePaths.push(imgPath);
                concatList += `file '${imgFileName}'\n`;
            }
            // Write the concat list file
            const concatFilePath = path_1.default.join(tempDir, 'input.txt');
            fs_1.default.writeFileSync(concatFilePath, concatList);
            // 4. Run FFmpeg using concat demuxer
            const outputPath = path_1.default.join(tempDir, 'output.mp4');
            await new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)()
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
            const uploadResult = await cloudinary_1.v2.uploader.upload(outputPath, {
                resource_type: 'video',
                folder: 'timelapses'
            });
            // 6. Update DB
            await jobRepo.update(jobId, {
                status: timelapse_job_model_1.TimelapseJobStatus.DONE,
                videoUrl: uploadResult.secure_url
            });
            // Clean up
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        }
        catch (err) {
            logger_1.logger.error(`Timelapse generation failed for job ${jobId}:`, err);
            await jobRepo.update(jobId, {
                status: timelapse_job_model_1.TimelapseJobStatus.FAILED,
                errorLog: err.message || 'Unknown error'
            });
        }
    }, { connection: connection });
    exports.timelapseWorker.on('completed', job => {
        logger_1.logger.info(`Timelapse job completed: ${job.id}`);
    });
    exports.timelapseWorker.on('failed', (job, err) => {
        logger_1.logger.error(`Timelapse job failed: ${job?.id}`, err);
    });
}
else {
    logger_1.logger.warn('Redis unavailable – timelapse worker disabled (serverless mode).');
}
