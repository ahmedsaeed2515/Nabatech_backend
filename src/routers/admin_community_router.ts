import { Router } from 'express';
import { protect, admin } from '../middlewares/auth_middleware';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { adminCommunityQuerySchema, adminModerationSchema } from '../validation/community_schemas';
import { adminGetPosts, adminModeratePost, adminResolvePost, adminGetComments, adminModerateComment, getCommunityAnalytics, getCommunityReputationStats, adminUpdatePost, adminUpdateComment, deleteAdminCommunityPost, restoreAdminCommunityPost, deleteAdminCommunityComment, restoreAdminCommunityComment, getAdminLogs, adminPinPost, adminUnpinPost, adminLockComments, adminUnlockComments, adminAddLikes, adminRemoveLikes, adminCreatePost } from '../controllers/admin_community_controller';
import { ReportController } from '../controllers/report_controller';

const router = Router();

router.get('/analytics', protect, admin, getCommunityAnalytics);
router.get('/reputation-stats', protect, admin, getCommunityReputationStats);
router.get('/logs', protect, admin, getAdminLogs);

router.get('/posts', protect, admin, validateRequest(adminCommunityQuerySchema), adminGetPosts);
router.post('/posts', protect, admin, adminCreatePost);
router.patch('/posts/:id/moderation', protect, admin, validateRequest(adminModerationSchema), adminModeratePost);
router.patch('/posts/:id/resolve', protect, admin, adminResolvePost);
router.put('/posts/:id', protect, admin, adminUpdatePost);
router.patch('/posts/:id', protect, admin, adminUpdatePost);
router.delete('/posts/:id', protect, admin, deleteAdminCommunityPost);
router.post('/posts/:id/restore', protect, admin, restoreAdminCommunityPost);
router.post('/posts/:id/pin', protect, admin, adminPinPost);
router.post('/posts/:id/unpin', protect, admin, adminUnpinPost);
router.post('/posts/:id/lock-comments', protect, admin, adminLockComments);
router.post('/posts/:id/unlock-comments', protect, admin, adminUnlockComments);
router.post('/posts/:id/likes/add', protect, admin, adminAddLikes);
router.post('/posts/:id/likes/remove', protect, admin, adminRemoveLikes);

router.get('/comments', protect, admin, validateRequest(adminCommunityQuerySchema), adminGetComments);
router.patch('/comments/:id/moderation', protect, admin, validateRequest(adminModerationSchema), adminModerateComment);
router.put('/comments/:id', protect, admin, adminUpdateComment);
router.patch('/comments/:id', protect, admin, adminUpdateComment);
router.delete('/comments/:id', protect, admin, deleteAdminCommunityComment);
router.post('/comments/:id/restore', protect, admin, restoreAdminCommunityComment);

// Reports
router.get('/reports', protect, admin, ReportController.getReports);
router.patch('/reports/:id/resolve', protect, admin, ReportController.resolveReport);
router.patch('/reports/:id/dismiss', protect, admin, ReportController.dismissReport);
router.patch('/posts/:id/hide', protect, admin, ReportController.hidePost);

export default router;



