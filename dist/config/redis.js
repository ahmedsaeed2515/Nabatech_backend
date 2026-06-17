"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisAvailable = void 0;
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Only connect to Redis if a URL is provided (e.g. not available on Vercel Hobby)
let redisClient = null;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    redisClient = new ioredis_1.Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    redisClient.on('error', (err) => {
        console.error('Redis error:', err.message);
    });
    redisClient.connect().catch((err) => {
        console.error('Redis connect failed:', err.message);
        redisClient = null;
    });
}
else {
    console.warn('REDIS_URL not set – Redis/BullMQ features disabled (serverless mode).');
}
const isRedisAvailable = () => redisClient !== null;
exports.isRedisAvailable = isRedisAvailable;
exports.default = redisClient;
