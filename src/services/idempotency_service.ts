import IdempotencyRecord from '../models/idempotency_record_model';
import mongoose from 'mongoose';
import { AppError } from '../utils/app_error';

export const runIdempotentAdminMutation = async <T>(
  actorId: string,
  scope: string,
  key: string,
  requestHash: string,
  mutationFn: (session: mongoose.ClientSession) => Promise<{ result: T, statusCode: number }>
): Promise<{ result: T, statusCode: number }> => {
  
  if (!key) {
    throw new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'Idempotency-Key is required' });
  }

  // Check if we already have this key
  const existing = await IdempotencyRecord.findOne({ actor: actorId, scope, key });
  
  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new AppError({ 
        code: 'CONFLICT', 
        statusCode: 409, 
        message: 'Idempotency key already used with a different request payload' 
      });
    }
    
    if (existing.state === 'completed') {
      return { result: existing.resultReference as T, statusCode: existing.statusCode || 200 };
    }
    
    if (existing.state === 'started') {
      throw new AppError({
        code: 'CONFLICT',
        statusCode: 409,
        message: 'A request with this idempotency key is already in progress'
      });
    }
  }

  // Start new idempotency
  const session = await mongoose.startSession();
  let result: T;
  let finalStatusCode: number;
  
  try {
    session.startTransaction();
    
    const record = new IdempotencyRecord({
      actor: new mongoose.Types.ObjectId(actorId),
      scope,
      key,
      requestHash,
      state: 'started',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Keep for 24h
    });
    await record.save({ session });
    
    // Execute the actual mutation
    const mutationOutput = await mutationFn(session);
    result = mutationOutput.result;
    finalStatusCode = mutationOutput.statusCode;
    
    // Update record
    record.state = 'completed';
    record.resultReference = result;
    record.statusCode = finalStatusCode;
    await record.save({ session });
    
    await session.commitTransaction();
    return { result, statusCode: finalStatusCode };
  } catch (error) {
    await session.abortTransaction();
    
    // If it failed, mark idempotency as failed so it can be retried safely
    await IdempotencyRecord.findOneAndUpdate(
      { actor: actorId, scope, key },
      { state: 'failed', resultReference: { error: String(error) } }
    ).catch(e => console.error("Failed to update idempotency error state", e));
    
    throw error;
  } finally {
    session.endSession();
  }
};
