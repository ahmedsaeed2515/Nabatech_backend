import { Router } from 'express';
import { protect } from '../middlewares/auth_middleware';
import { getHomeToolsAnalytics } from '../controllers/home_tools_controller';

const router = Router();

router.get('/analytics', protect, getHomeToolsAnalytics);

export default router;


