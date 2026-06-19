import { Router } from 'express';
import { getExpertProfile, updateMyExpertProfile } from '../controllers/expert_controller';
import { protect, authorizeRoles } from '../middlewares/auth_middleware';

const router = Router();

// Profile viewing is accessible to any authenticated user
router.get('/:id', protect, getExpertProfile);

// Profile updating is restricted to experts only
router.put('/me/profile', protect, authorizeRoles('expert'), updateMyExpertProfile);

export default router;
