import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
// @ts-ignore
import MongoStore from 'rate-limit-mongo';
import { env } from '../config/env';

// Determine the store based on deployment mode
const createStore = () => {
  if (env.DEPLOYMENT_MODE === 'multi-instance' || env.DEPLOYMENT_MODE === 'serverless') {
    const uri = env.MONGODB_URI || env.MONGO_URI;
    if (uri) {
      return new MongoStore({
        uri: uri,
        collectionName: 'rateLimitCounters',
        expireTimeMs: 15 * 60 * 1000,
        errorHandler: console.error.bind(null, 'rate-limit-mongo')
      });
    }
  }
  // Default to memory store for single-instance
  return undefined; 
};

const store = createStore();

const message = { 
  success: false, 
  error: {
    code: 'RATE_LIMITED',
    status: 429,
    message: "Too many attempts. Try again later."
  },
  // legacy alias
  message: "Too many attempts. Try again later."
};

// Default rate limit builder
const createLimiter = (options: { windowMs: number, max: number, keyGenerator?: any }) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message,
    skip: (req) => process.env.NODE_ENV === 'test',
    keyGenerator: options.keyGenerator
  });
};

// Login 5 attempts/15 min per email+IP
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req: any) => `${ipKeyGenerator(req.ip)}_${req.body.email || ''}`
});

// Register 10/IP/15 min
export const registerLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// Forgot/reset/verify 5/IP/15 min
export const strictAuthLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5
});

// Refresh 60/device/15 min (or IP if device ID isn't used)
export const refreshLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req: any) => `${ipKeyGenerator(req.ip)}_${req.body.deviceId || 'unknown'}`
});
