import { Router } from 'express';
import { 
  getExpertProfile, 
  updateMyExpertProfile,
  getEscalations,
  claimEscalation,
  resolveEscalation,
  streamEscalations
} from '../controllers/expert_controller';
import { protect, authorizeRoles } from '../middlewares/auth_middleware';

const router = Router();

// Admin / Expert Escalation Routes
router.get('/admin/escalations/stream', protect, authorizeRoles('admin', 'expert', 'staff'), streamEscalations);
router.get('/admin/escalations', protect, authorizeRoles('admin', 'expert', 'staff'), getEscalations);
router.post('/admin/escalations/:id/claim', protect, authorizeRoles('admin', 'expert', 'staff'), claimEscalation);
router.post('/admin/escalations/:id/resolve', protect, authorizeRoles('admin', 'expert', 'staff'), resolveEscalation);

// Profile viewing is accessible to any authenticated user
router.get('/:id', protect, getExpertProfile);

// Profile updating is restricted to experts only
router.put('/me/profile', protect, authorizeRoles('expert'), updateMyExpertProfile);

export default router;
