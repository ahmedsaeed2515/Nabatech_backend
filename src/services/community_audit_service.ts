import CommunityAudit from '../models/community_audit_model';

export class CommunityAuditService {
  static async logAction(actorId: string, action: string, targetType: string, targetId: string, metadata?: any) {
    try {
      await CommunityAudit.create({
        actor: actorId,
        action,
        targetType,
        targetId,
        metadata
      });
    } catch (error) {
      console.error('Failed to log community audit action:', error);
    }
  }
}


