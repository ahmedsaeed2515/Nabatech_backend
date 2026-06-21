import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Request } from "express";
import redisClient from "../config/redis";

const store = redisClient
  ? new RedisStore({
      sendCommand: (...args: string[]) => (redisClient as any).call(...args),
    })
  : undefined; // fallback to default MemoryStore if Redis isn't configured

// Define the global rate limiter for the application
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased limit from 5000 to 10000
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      details: "You have exceeded the maximum number of requests allowed.",
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Removed custom keyGenerator to use the built-in default which handles IPv6 safely
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP/User to 10 requests per minute
  message: {
    success: false,
    message: "Too many AI requests, please try again after a minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store,
});

// Standard limit for login attempts (5 per 15 minutes)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  store,
});

// Stricter limit for registration (3 per hour)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many accounts created from this IP, please try again after an hour" },
  standardHeaders: true,
  legacyHeaders: false,
  store,
});

// Strict auth actions (password reset, email verification etc.) - 3 per 15 mins
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  store,
});

// Refresh token limit - 20 per 15 mins
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many refresh token requests" },
  standardHeaders: true,
  legacyHeaders: false,
  store,
});
