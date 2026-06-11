import { Router } from 'express';
import { protect } from '../middlewares/auth_middleware';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { adminCommunityQuerySchema, adminModerationSchema } from '../validation/community_schemas';
import { adminGetPosts, adminModeratePost, adminGetComments, adminModerateComment } from '../controllers/admin_community_controller';
import { AppError } from '../utils/app_error';

const router = Router();

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.accountType === 'admin') {
    next();
  } else {
    next(new AppError({ message: 'Admin access required', statusCode: 403, code: 'AUTH_FORBIDDEN' }));
  }
};

router.get('/posts', protect, requireAdmin, validateRequest(adminCommunityQuerySchema), adminGetPosts);
router.patch('/posts/:id/moderation', protect, requireAdmin, validateRequest(adminModerationSchema), adminModeratePost);

router.get('/comments', protect, requireAdmin, validateRequest(adminCommunityQuerySchema), adminGetComments);
router.patch('/comments/:id/moderation', protect, requireAdmin, validateRequest(adminModerationSchema), adminModerateComment);

export default router;
