"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timelapseQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// timelapseQueue is only available when REDIS_URL is set
let timelapseQueue = null;
exports.timelapseQueue = timelapseQueue;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    const connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    exports.timelapseQueue = timelapseQueue = new bullmq_1.Queue('timelapse.generate', { connection: connection });
}
else {
    console.warn('REDIS_URL not set – timelapseQueue disabled (serverless mode).');
}
