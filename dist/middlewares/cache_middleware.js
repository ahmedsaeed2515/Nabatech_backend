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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCacheHeaders = exports.cacheResponse = void 0;
const redis_1 = __importStar(require("../config/redis"));
const logger_1 = require("../utils/logger");
/**
 * Middleware to cache HTTP responses
 * @param durationInSeconds How long to cache the response
 */
const cacheResponse = (durationInSeconds) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        // Skip if Redis is not available
        if (!(0, redis_1.isRedisAvailable)() || !redis_1.default) {
            return next();
        }
        // Create a unique key based on URL and query params
        const key = `cache:${req.originalUrl || req.url}`;
        try {
            const cachedResponse = await redis_1.default.get(key);
            if (cachedResponse) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
                return res.json(JSON.parse(cachedResponse));
            }
            res.setHeader('X-Cache', 'MISS');
            // Intercept the res.json method to capture the response body
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redis_1.default?.setex(key, durationInSeconds, JSON.stringify(body)).catch(err => {
                        logger_1.logger.warn(`Failed to cache response for ${key}:`, err);
                    });
                }
                return originalJson(body);
            };
            next();
        }
        catch (err) {
            logger_1.logger.warn(`Redis cache middleware error for ${key}:`, err);
            next();
        }
    };
};
exports.cacheResponse = cacheResponse;
/**
 * Helper to generate Cache-Control headers without Redis caching
 * Good for static assets or resources that change rarely
 */
const setCacheHeaders = (durationInSeconds) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
        }
        next();
    };
};
exports.setCacheHeaders = setCacheHeaders;
