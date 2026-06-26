import { Router, Request, Response } from 'express';
import { processOutboxJobs } from '../workers/outbox_worker';
import { env } from '../config/env';
import axios from 'axios';

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

/**
 * GET /api/internal/warmup-ai
 * Pings HuggingFace Spaces to prevent cold starts.
 * Protected by CRON_SECRET. Should be called by Vercel cron every 4 min.
 */
router.get('/warmup-ai', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(403).json({ success: false, message: 'AUTH_FORBIDDEN' });
  }

  const HF_ENDPOINTS = [
    'https://ahmedsaeed111-agrirag-pro.hf.space/ask',  // hf_v62 — primary LLM
    'https://ahmedsaeed111-rag-only.hf.space/ask',      // hf_v8  — fallback LLM
  ];

  const WARMUP_BODY = { question: 'ping', history: [] };
  const results: { url: string; status: string }[] = [];

  await Promise.allSettled(
    HF_ENDPOINTS.map(async (url) => {
      try {
        await axios.post(url, WARMUP_BODY, {
          timeout: 6000,
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true,
        });
        results.push({ url, status: 'pinged' });
      } catch {
        results.push({ url, status: 'timeout_or_error' });
      }
    })
  );

  return res.status(200).json({
    success: true,
    pinged: results,
    ts: new Date().toISOString()
  });
});

export default router;
