import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

export const generateAccessToken = (id: string, role: string, tokenVersion: number): string => {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id, sub: id, role, tokenVersion }, jwtSecret, { expiresIn: '15m' });
};

export const generateRefreshToken = (id: string): { token: string, jti: string } => {
  const refreshSecret = env.JWT_REFRESH_SECRET;
  if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is not configured');
  
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id, jti }, refreshSecret, { expiresIn: '30d' });
  return { token, jti };
};

export const hashToken = (token: string): string => {
  if (!env.TOKEN_HASH_SECRET) throw new Error('TOKEN_HASH_SECRET is not configured');
  return crypto.createHmac('sha256', env.TOKEN_HASH_SECRET).update(token).digest('hex');
};

export default generateAccessToken;
