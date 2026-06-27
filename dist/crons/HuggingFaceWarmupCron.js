"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHuggingFaceWarmupCron = void 0;
/**
 * HuggingFaceWarmupCron
 *
 * Sends a lightweight "ping" request to the HuggingFace Spaces endpoints
 * every 4 minutes to prevent cold starts (free tier spaces sleep after ~5min).
 *
 * This runs in single-instance / multi-instance mode (not serverless).
 * For Vercel (serverless), use the /api/internal/warmup-ai endpoint via cron.json.
 */
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const HF_ENDPOINTS = [
    'https://ahmedsaeed111-agrirag-pro.hf.space/ask', // hf_v62 — primary LLM
    'https://ahmedsaeed111-rag-only.hf.space/ask', // hf_v8  — fallback LLM
    'https://abdallah110-cnnn.hf.space/health', // CNN — image diagnosis
];
const WARMUP_PAYLOAD = {
    question: 'ping',
    history: [],
};
async function pingEndpoint(url) {
    try {
        // Use a short timeout — we just want to wake it up, not wait for a real answer
        await axios_1.default.post(url, WARMUP_PAYLOAD, {
            timeout: 8000,
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true, // Accept any HTTP status
        });
        logger_1.logger.info(`[HF_WARMUP] ✅ Pinged ${url}`);
    }
    catch (err) {
        // Timeouts are expected on the first ping (cold start still waking up)
        logger_1.logger.warn(`[HF_WARMUP] ⚠️  Could not ping ${url}: ${err.message}`);
    }
}
const startHuggingFaceWarmupCron = () => {
    // Run every 4 minutes to keep spaces warm (they sleep after ~5 min of inactivity)
    node_cron_1.default.schedule('*/4 * * * *', async () => {
        logger_1.logger.info('[HF_WARMUP] Sending keepalive pings to HuggingFace Spaces...');
        // Ping all endpoints in parallel — non-blocking
        await Promise.allSettled(HF_ENDPOINTS.map(pingEndpoint));
    });
    logger_1.logger.info('[HF_WARMUP] Warmup cron started (every 4 min)');
};
exports.startHuggingFaceWarmupCron = startHuggingFaceWarmupCron;
