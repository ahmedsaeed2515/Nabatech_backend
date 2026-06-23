import { Router } from 'express';
import { protect, admin } from '../middlewares/auth_middleware';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { adminCommunityQuerySchema, adminModerationSchema } from '../validation/community_schemas';
import { adminGetPosts, adminModeratePost, adminResolvePost, adminGetComments, adminModerateComment, getCommunityAnalytics, getCommunityReputationStats, adminUpdatePost } from '../controllers/admin_community_controller';
import { ReportController } from '../controllers/report_controller';

const router = Router();

router.get('/analytics', protect, admin, getCommunityAnalytics);
router.get('/reputation-stats', protect, admin, getCommunityReputationStats);

router.get('/posts', protect, admin, validateRequest(adminCommunityQuerySchema), adminGetPosts);
router.patch('/posts/:id/moderation', protect, admin, validateRequest(adminModerationSchema), adminModeratePost);
router.patch('/posts/:id/resolve', protect, admin, adminResolvePost);
router.put('/posts/:id', protect, admin, adminUpdatePost);

router.get('/comments', protect, admin, validateRequest(adminCommunityQuerySchema), adminGetComments);
router.patch('/comments/:id/moderation', protect, admin, validateRequest(adminModerationSchema), adminModerateComment);

// Reports
router.get('/reports', protect, admin, ReportController.getReports);
router.patch('/reports/:id/resolve', protect, admin, ReportController.resolveReport);
router.patch('/reports/:id/dismiss', protect, admin, ReportController.dismissReport);
router.patch('/posts/:id/hide', protect, admin, ReportController.hidePost);

export default router;

