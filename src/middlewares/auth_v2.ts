import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user_model';

export const protectV2 = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'fallback_secret';
      const decoded = jwt.verify(token, secret) as any;
      
      // decoded should have userId from V2 AuthService
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Not authorized, user not found' });
      }

      (req as any).user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
  }
};
