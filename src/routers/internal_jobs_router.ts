import { Router, Request, Response } from 'express';
import { processOutboxJobs } from '../workers/outbox_worker';
import { env } from '../config/env';

const router = Router();

router.get('/drain', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!env.CRON_SECRET) {
    return res.status(503).json({ success: false, message: 'CRON_SECRET not configured' });
  }
  
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(403).json({ success: false, message: 'AUTH_FORBIDDEN' });
  }
  
  try {
    let maxJobs = parseInt(req.query.maxJobs as string, 10) || 50;
    if (maxJobs > 100) maxJobs = 100;
    
    const result = await processOutboxJobs(maxJobs);
    
    return res.status(200).json({
      success: true,
      data: result,
      requestId: (req as any).requestId || res.locals.requestId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
  }
});

export default router;


