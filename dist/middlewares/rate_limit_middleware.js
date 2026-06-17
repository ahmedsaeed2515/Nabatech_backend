"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshLimiter = exports.strictAuthLimiter = exports.registerLimiter = exports.loginLimiter = void 0;
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
// @ts-ignore
const rate_limit_mongo_1 = __importDefault(require("rate-limit-mongo"));
const env_1 = require("../config/env");
// Determine the store based on deployment mode
const createStore = () => {
    if (env_1.env.DEPLOYMENT_MODE === 'multi-instance' || env_1.env.DEPLOYMENT_MODE === 'serverless') {
        const uri = env_1.env.MONGODB_URI || env_1.env.MONGO_URI;
        if (uri) {
            return new rate_limit_mongo_1.default({
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
const createLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
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
exports.loginLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => `${(0, express_rate_limit_1.ipKeyGenerator)(req.ip)}_${req.body.email || ''}`
});
// Register 10/IP/15 min
exports.registerLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10
});
// Forgot/reset/verify 5/IP/15 min
exports.strictAuthLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5
});
// Refresh 60/device/15 min (or IP if device ID isn't used)
exports.refreshLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
    keyGenerator: (req) => `${(0, express_rate_limit_1.ipKeyGenerator)(req.ip)}_${req.body.deviceId || 'unknown'}`
});
