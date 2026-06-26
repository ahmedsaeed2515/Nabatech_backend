import AdminAudit from '../models/admin_audit_model';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const recordAdminAudit = async ({
  actorId,
  action,
  targetType,
  targetId,
  result,
  requestId,
  beforeSummary,
  afterSummary,
  session
}: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  result: 'success' | 'failure';
  requestId?: string;
  beforeSummary?: any;
  afterSummary?: any;
  session?: mongoose.ClientSession;
}) => {
  try {
    const audit = new AdminAudit({
      actor: new mongoose.Types.ObjectId(actorId),
      action,
      targetType,
      targetId,
      result,
      requestId,
      beforeSummary,
      afterSummary
    });
    
    await audit.save({ session });
  } catch (error) {
    // Audit log failures should generally not crash the main transaction,
    // but they should be loudly logged.
    logger.error('Failed to record admin audit', { error, actorId, action, targetId });
  }
};


