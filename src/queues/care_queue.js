"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.careSyncQueue = void 0;
var bullmq_1 = require("bullmq");
var ioredis_1 = __importDefault(require("ioredis"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// careSyncQueue is only available when REDIS_URL is set
var careSyncQueue = null;
exports.careSyncQueue = careSyncQueue;
var redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    var connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    exports.careSyncQueue = careSyncQueue = new bullmq_1.Queue('care.sync', { connection: connection });
}
else {
    console.warn('REDIS_URL not set – careSyncQueue disabled (serverless mode).');
}
