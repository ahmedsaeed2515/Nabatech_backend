import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  // Attach to request and response locals
  (req as any).requestId = requestId;
  (res as any).requestId = requestId;
  res.locals.requestId = requestId;
  // Set response header
  res.setHeader('X-Request-Id', requestId);
  // Store start time for logging
  (req as any).requestStart = Date.now();
  next();
};


