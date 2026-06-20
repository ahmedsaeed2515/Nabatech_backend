"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisAvailable = void 0;
var ioredis_1 = require("ioredis");
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Only connect to Redis if a URL is provided (e.g. not available on Vercel Hobby)
var redisClient = null;
var redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    redisClient = new ioredis_1.Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    redisClient.on('error', function (err) {
        console.error('Redis error:', err.message);
    });
    redisClient.connect().catch(function (err) {
        console.error('Redis connect failed:', err.message);
        redisClient = null;
    });
}
else {
    console.warn('REDIS_URL not set – Redis/BullMQ features disabled (serverless mode).');
}
var isRedisAvailable = function () { return redisClient !== null; };
exports.isRedisAvailable = isRedisAvailable;
exports.default = redisClient;
