"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityFollowLimiter = exports.communitySearchLimiter = exports.communityReportLimiter = exports.communityCommentLimiter = exports.communityPostLimiter = exports.refreshLimiter = exports.strictAuthLimiter = exports.registerLimiter = exports.loginLimiter = exports.aiRateLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const redis_1 = __importDefault(require("../config/redis"));
const store = redis_1.default
    ? new rate_limit_redis_1.default({
        sendCommand: (...args) => redis_1.default.call(...args),
    })
    : undefined; // fallback to default MemoryStore if Redis isn't configured
// Define the global rate limiter for the application
exports.apiLimiter = (0, express_rate_limit_1.default)({
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
// Community Limits
exports.communityPostLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 20, // 20 posts per hour
    message: { success: false, message: "Too many posts created, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
exports.communityCommentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 60, // 60 comments per hour
    message: { success: false, message: "Too many comments created, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
exports.communityReportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 20, // 20 reports per hour
    message: { success: false, message: "Too many reports submitted, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
exports.communitySearchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 200, // 200 searches per hour
    message: { success: false, message: "Too many search requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
exports.communityFollowLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 100, // 100 follow requests per hour
    message: { success: false, message: "Too many follow requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    store,
});
