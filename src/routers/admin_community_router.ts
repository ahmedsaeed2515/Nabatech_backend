import { Router } from 'express';
import { protect, admin } from '../middlewares/auth_middleware';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { adminCommunityQuerySchema, adminModerationSchema } from '../validation/community_schemas';
import { adminGetPosts, adminModeratePost, adminResolvePost, adminGetComments, adminModerateComment } from '../controllers/admin_community_controller';
import { AppError } from '../utils/app_error';

const router = Router();

router.get('/posts', protect, admin, validateRequest(adminCommunityQuerySchema), adminGetPosts);
router.patch('/posts/:id/moderation', protect, admin, validateRequest(adminModerationSchema), adminModeratePost);
router.patch('/posts/:id/resolve', protect, admin, adminResolvePost);

router.get('/comments', protect, admin, validateRequest(adminCommunityQuerySchema), adminGetComments);
router.patch('/comments/:id/moderation', protect, admin, validateRequest(adminModerationSchema), adminModerateComment);

export default router;
