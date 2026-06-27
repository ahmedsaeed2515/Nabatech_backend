"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const ai_memory_model_1 = __importDefault(require("../../models/ai_memory_model"));
class MemoryManager {
    static async saveShortTermMemory(userId, key, value, ttlMinutes = 60) {
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        const existing = await ai_memory_model_1.default.findOne({ userId, type: "short_term", key }).lean();
        if (existing) {
            console.log(`[MEMORY_MANAGER] Overwriting short_term memory for user ${userId}: key=${key}`);
        }
        await ai_memory_model_1.default.findOneAndUpdate({ userId, type: "short_term", key }, { value, expiresAt }, { upsert: true, new: true });
    }
    static async getShortTermMemory(userId, key) {
        const record = await ai_memory_model_1.default.findOne({ userId, type: "short_term", key }).lean();
        if (!record || (record.expiresAt && record.expiresAt < new Date())) {
            return null;
        }
        return record.value;
    }
    static async saveLongTermMemory(userId, key, value) {
        await ai_memory_model_1.default.findOneAndUpdate({ userId, type: "long_term", key }, { value }, { upsert: true, new: true });
    }
    static async getLongTermMemory(userId, key) {
        const record = await ai_memory_model_1.default.findOne({ userId, type: "long_term", key }).lean();
        return record?.value;
    }
    static async getAllContext(userId) {
        const records = await ai_memory_model_1.default.find({ userId }).lean();
        const now = new Date();
        const context = {
            shortTerm: {},
            longTerm: {}
        };
        records.forEach(r => {
            if (r.type === "short_term" && (!r.expiresAt || r.expiresAt > now)) {
                context.shortTerm[r.key] = r.value;
            }
            else if (r.type === "long_term") {
                context.longTerm[r.key] = r.value;
            }
        });
        return context;
    }
}
exports.MemoryManager = MemoryManager;
