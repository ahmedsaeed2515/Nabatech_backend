import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user_model';
import { AppError } from '../utils/app_error';
import { env } from '../config/env';

interface JwtPayload {
  id: string;
  sub: string;
  role: string;
  tokenVersion: number;
}

/**
 * protectV2
 * ─────────
 * Validates the Bearer access token issued by generateAccessToken().
 * Performs the same three security gates as the V1 `protect` middleware:
 *   1. Signature verification against JWT_SECRET
 *   2. Account-disabled check  (status === 'disabled')
 *   3. Token-version check     (prevents stale tokens after password reset / logout-all)
 */
export const protectV2 = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // ── 1. Verify signature ─────────────────────────────────────────────
      const jwtSecret = env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new AppError({ code: 'SERVER_ERROR', statusCode: 500, message: 'JWT_SECRET is not configured' }));
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // Access tokens from generateAccessToken() carry { id, sub, role, tokenVersion }
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, user not found' }));
      }

      // ── 2. Account status gate ─────────────────────────────────────────
      if (user.status === 'disabled') {
        return next(new AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' }));
      }

      // ── 3. Token-version gate (invalidates tokens after password reset / logout-all) ─
      if (user.tokenVersion !== decoded.tokenVersion) {
        return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Token invalid or revoked' }));
      }

      (req as any).user = user;
      return next();
    } catch (err) {
      return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, token failed' }));
    }
  }

  if (!token) {
    return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, no token' }));
  }
};


