"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopOutboxPolling = exports.startOutboxPolling = exports.processOutboxJobs = void 0;
const outbox_job_model_1 = __importDefault(require("../models/outbox_job_model"));
const email_service_1 = require("../services/email_service");
const logger_1 = require("../utils/logger");
const processOutboxJobs = async (maxJobs = 100) => {
    let processedCount = 0;
    let retriedCount = 0;
    let deadLetteredCount = 0;
    const now = new Date();
    // Find pending jobs, or processing jobs whose lease has expired
    const jobsToProcess = await outbox_job_model_1.default.find({
        $or: [
            { status: 'pending', availableAt: { $lte: now } },
            { status: 'processing', leaseUntil: { $lte: now } },
            { status: 'failed', availableAt: { $lte: now }, attemptCount: { $lt: 8 } }
        ]
    }).sort({ availableAt: 1 }).limit(maxJobs);
    for (const job of jobsToProcess) {
        // Acquire lease using optimistic locking
        const leaseTime = new Date(Date.now() + 60 * 1000); // 1 min lease
        const acquired = await outbox_job_model_1.default.findOneAndUpdate({
            _id: job._id,
            // Ensure the job hasn't been picked up by another worker
            $or: [
                { status: 'pending' },
                { status: 'processing', leaseUntil: { $lte: now } },
                { status: 'failed' }
            ]
        }, {
            status: 'processing',
            leaseUntil: leaseTime,
            $inc: { attemptCount: 1 }
        }, { new: true });
        if (!acquired) {
            continue; // Another worker got it
        }
        try {
            // Execute based on type
            if (job.type === 'email_verification') {
                await (0, email_service_1.sendVerificationEmail)(job.payload.email, job.payload.token);
            }
            else if (job.type === 'password_reset') {
                await (0, email_service_1.sendPasswordResetEmail)(job.payload.email, job.payload.token);
            }
            else {
                throw new Error(`Unknown job type: ${job.type}`);
            }
            // Success
            await outbox_job_model_1.default.updateOne({ _id: job._id }, { status: 'completed' });
            processedCount++;
            logger_1.logger.info('outbox.job.succeeded', { jobId: job._id, type: job.type });
        }
        catch (error) {
            const errorMessage = error.message || String(error);
            const attempts = acquired.attemptCount;
            if (attempts >= 8) {
                // Dead letter
                await outbox_job_model_1.default.updateOne({ _id: job._id }, {
                    status: 'dead_letter',
                    lastError: errorMessage,
                    deadLetteredAt: new Date()
                });
                deadLetteredCount++;
                logger_1.logger.error('outbox.job.dead_lettered', { jobId: job._id, type: job.type, error: errorMessage });
            }
            else {
                // Retry with exponential backoff (2^attempts minutes)
                const backoffMinutes = Math.pow(2, attempts);
                const nextAvailable = new Date(Date.now() + backoffMinutes * 60 * 1000);
                await outbox_job_model_1.default.updateOne({ _id: job._id }, {
                    status: 'failed',
                    lastError: errorMessage,
                    availableAt: nextAvailable
                });
                retriedCount++;
                logger_1.logger.warn('outbox.job.failed', { jobId: job._id, type: job.type, attempt: attempts, error: errorMessage });
            }
        }
    }
    return { processed: processedCount, retried: retriedCount, deadLettered: deadLetteredCount };
};
exports.processOutboxJobs = processOutboxJobs;
// Background polling for single-instance mode
let isPolling = false;
let pollingInterval = null;
const startOutboxPolling = (intervalMs = 10000) => {
    if (isPolling)
        return;
    isPolling = true;
    const poll = async () => {
        try {
            await (0, exports.processOutboxJobs)(50);
        }
        catch (error) {
            logger_1.logger.error('Error polling outbox jobs', { error });
        }
        if (isPolling) {
            pollingInterval = setTimeout(poll, intervalMs);
        }
    };
    poll();
};
exports.startOutboxPolling = startOutboxPolling;
const stopOutboxPolling = () => {
    isPolling = false;
    if (pollingInterval) {
        clearTimeout(pollingInterval);
        pollingInterval = null;
    }
};
exports.stopOutboxPolling = stopOutboxPolling;
