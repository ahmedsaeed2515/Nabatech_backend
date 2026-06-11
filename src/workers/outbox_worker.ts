import OutboxJob from '../models/outbox_job_model';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email_service';
import { logger } from '../utils/logger';

export const processOutboxJobs = async (maxJobs = 100): Promise<{ processed: number, retried: number, deadLettered: number }> => {
  let processedCount = 0;
  let retriedCount = 0;
  let deadLetteredCount = 0;
  
  const now = new Date();
  
  // Find pending jobs, or processing jobs whose lease has expired
  const jobsToProcess = await OutboxJob.find({
    $or: [
      { status: 'pending', availableAt: { $lte: now } },
      { status: 'processing', leaseUntil: { $lte: now } },
      { status: 'failed', availableAt: { $lte: now }, attemptCount: { $lt: 8 } }
    ]
  }).sort({ availableAt: 1 }).limit(maxJobs);

  for (const job of jobsToProcess) {
    // Acquire lease using optimistic locking
    const leaseTime = new Date(Date.now() + 60 * 1000); // 1 min lease
    
    const acquired = await OutboxJob.findOneAndUpdate(
      { 
        _id: job._id, 
        // Ensure the job hasn't been picked up by another worker
        $or: [
          { status: 'pending' },
          { status: 'processing', leaseUntil: { $lte: now } },
          { status: 'failed' }
        ]
      },
      { 
        status: 'processing', 
        leaseUntil: leaseTime,
        $inc: { attemptCount: 1 } 
      },
      { new: true }
    );
    
    if (!acquired) {
      continue; // Another worker got it
    }
    
    try {
      // Execute based on type
      if (job.type === 'email_verification') {
        await sendVerificationEmail(job.payload.email, job.payload.token);
      } else if (job.type === 'password_reset') {
        await sendPasswordResetEmail(job.payload.email, job.payload.token);
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }
      
      // Success
      await OutboxJob.updateOne({ _id: job._id }, { status: 'completed' });
      processedCount++;
      logger.info('outbox.job.succeeded', { jobId: job._id, type: job.type });
      
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      const attempts = acquired.attemptCount;
      
      if (attempts >= 8) {
        // Dead letter
        await OutboxJob.updateOne(
          { _id: job._id }, 
          { 
            status: 'dead_letter', 
            lastError: errorMessage,
            deadLetteredAt: new Date()
          }
        );
        deadLetteredCount++;
        logger.error('outbox.job.dead_lettered', { jobId: job._id, type: job.type, error: errorMessage });
      } else {
        // Retry with exponential backoff (2^attempts minutes)
        const backoffMinutes = Math.pow(2, attempts);
        const nextAvailable = new Date(Date.now() + backoffMinutes * 60 * 1000);
        
        await OutboxJob.updateOne(
          { _id: job._id },
          {
            status: 'failed',
            lastError: errorMessage,
            availableAt: nextAvailable
          }
        );
        retriedCount++;
        logger.warn('outbox.job.failed', { jobId: job._id, type: job.type, attempt: attempts, error: errorMessage });
      }
    }
  }
  
  return { processed: processedCount, retried: retriedCount, deadLettered: deadLetteredCount };
};

// Background polling for single-instance mode
let isPolling = false;
let pollingInterval: NodeJS.Timeout | null = null;

export const startOutboxPolling = (intervalMs = 10000) => {
  if (isPolling) return;
  isPolling = true;
  
  const poll = async () => {
    try {
      await processOutboxJobs(50);
    } catch (error) {
      logger.error('Error polling outbox jobs', { error });
    }
    
    if (isPolling) {
      pollingInterval = setTimeout(poll, intervalMs);
    }
  };
  
  poll();
};

export const stopOutboxPolling = () => {
  isPolling = false;
  if (pollingInterval) {
    clearTimeout(pollingInterval);
    pollingInterval = null;
  }
};
