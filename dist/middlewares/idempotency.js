"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyCheck = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = require("../utils/logger");
const IdempotencyCheck = async (req, res, next) => {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'DELETE') {
        return next();
    }
    const idempotencyKey = req.header('x-client-operation-id');
    if (!idempotencyKey) {
        return next();
    }
    // If Redis is unavailable (serverless/no REDIS_URL), skip idempotency silently
    if (!redis_1.default) {
        return next();
    }
    const redisKey = `idemp:${idempotencyKey}`;
    try {
        const cachedResponse = await redis_1.default.get(redisKey);
        if (cachedResponse) {
            logger_1.logger.info(`Idempotency key hit for ${idempotencyKey}`);
            const parsed = JSON.parse(cachedResponse);
            res.status(parsed.status).json(parsed.body);
            return;
        }
        // Override res.send to intercept and cache the response
        const originalSend = res.send.bind(res);
        res.send = (body) => {
            const responseToCache = {
                status: res.statusCode,
                body: typeof body === 'string' ? JSON.parse(body) : body,
            };
            // TTL: 48h (48 * 60 * 60 = 172800)
            redis_1.default.set(redisKey, JSON.stringify(responseToCache), 'EX', 172800).catch((err) => {
                logger_1.logger.error('Failed to cache idempotency response', err);
            });
            return originalSend(body);
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Error checking idempotency', error);
        next();
    }
};
exports.IdempotencyCheck = IdempotencyCheck;
