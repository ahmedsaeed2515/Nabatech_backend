import express from 'express';
import { broadcastNotification, getBroadcastHistory } from '../controllers/admin_notifications_controller';
import { protect, admin } from '../middlewares/auth_middleware';

const router = express.Router();

// @route   POST /api/admin/notifications/broadcast
router.post('/broadcast', protect, admin, broadcastNotification);

// @route   GET /api/admin/notifications/history
router.get('/history', protect, admin, getBroadcastHistory);

export default router;
