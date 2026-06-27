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
exports.invalidateCachePattern = exports.invalidateCache = exports.getOrSetCache = void 0;
const redis_1 = __importStar(require("../config/redis"));
const logger_1 = require("./logger");
/**
 * Gets a value from cache or executes the fetcher function to get it, cache it, and return it.
 * @param key The cache key
 * @param ttlSeconds Time to live in seconds
 * @param fetcher Function that returns a Promise with the data to cache
 * @returns The cached or freshly fetched data
 */
const getOrSetCache = async (key, ttlSeconds, fetcher) => {
    // If Redis is not available, just bypass cache
    if (!(0, redis_1.isRedisAvailable)() || !redis_1.default) {
        return await fetcher();
    }
    try {
        const cachedData = await redis_1.default.get(key);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    }
    catch (err) {
        logger_1.logger.warn(`Redis cache get error for key ${key}:`, err);
    }
    // Fetch fresh data
    const freshData = await fetcher();
    // Save to cache asynchronously without blocking the response
    if (freshData !== undefined && freshData !== null) {
        try {
            // Don't await, let it save in the background
            redis_1.default.setex(key, ttlSeconds, JSON.stringify(freshData)).catch(err => {
                logger_1.logger.warn(`Redis cache set error for key ${key}:`, err);
            });
        }
        catch (err) {
            logger_1.logger.warn(`Redis cache stringify error for key ${key}:`, err);
        }
    }
    return freshData;
};
exports.getOrSetCache = getOrSetCache;
/**
 * Invalidates a specific cache key
 * @param key The cache key to invalidate
 */
const invalidateCache = async (key) => {
    if (!(0, redis_1.isRedisAvailable)() || !redis_1.default)
        return;
    try {
        await redis_1.default.del(key);
    }
    catch (err) {
        logger_1.logger.warn(`Redis cache invalidation error for key ${key}:`, err);
    }
};
exports.invalidateCache = invalidateCache;
/**
 * Invalidates multiple cache keys by pattern (e.g. 'plant-library:*')
 * Note: Use cautiously in production as KEYS can block Redis
 * @param pattern The pattern to match
 */
const invalidateCachePattern = async (pattern) => {
    if (!(0, redis_1.isRedisAvailable)() || !redis_1.default)
        return;
    try {
        const keys = await redis_1.default.keys(pattern);
        if (keys.length > 0) {
            await redis_1.default.del(...keys);
        }
    }
    catch (err) {
        logger_1.logger.warn(`Redis cache pattern invalidation error for pattern ${pattern}:`, err);
    }
};
exports.invalidateCachePattern = invalidateCachePattern;
