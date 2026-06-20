"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshLimiter = exports.strictAuthLimiter = exports.registerLimiter = exports.loginLimiter = exports.aiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const redis_1 = __importDefault(require("../config/redis"));
const store = redis_1.default
    ? new rate_limit_redis_1.default({
        sendCommand: (...args) => redis_1.default.call(...args),
    })
    : undefined; // fallback to default MemoryStore if Redis isn't configured
exports.aiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP/User to 10 requests per minute
    message: {
        success: false,
        message: "Too many AI requests, please try again after a minute",
    },
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: (req) => {
        // Rate limit by User ID if authenticated, otherwise by IP
        return req?.user?.id || req.ip;
    },
});
// Standard limit for login attempts (5 per 15 minutes)
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many login attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
// Stricter limit for registration (3 per hour)
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { success: false, message: "Too many accounts created from this IP, please try again after an hour" },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
// Strict auth actions (password reset, email verification etc.) - 3 per 15 mins
exports.strictAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { success: false, message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
// Refresh token limit - 20 per 15 mins
exports.refreshLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many refresh token requests" },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
