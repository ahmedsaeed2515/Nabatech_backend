import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to track API response times and log slow requests
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  // Intercept the finish event which fires when the response is fully sent
  res.on('finish', () => {
    const diff = process.hrtime(start);
    // Convert to milliseconds
    const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6);
    
    // Log slow requests (e.g., > 2000ms)
    if (timeMs > 2000) {
      logger.warn({
        message: 'Slow API Response Detected',
        method: req.method,
        url: req.originalUrl || req.url,
        timeMs: timeMs.toFixed(2),
        statusCode: res.statusCode,
      });
    } else {
      // Trace log for normal requests
      logger.debug({
        method: req.method,
        url: req.originalUrl || req.url,
        timeMs: timeMs.toFixed(2),
      });
    }
  });

  next();
};
