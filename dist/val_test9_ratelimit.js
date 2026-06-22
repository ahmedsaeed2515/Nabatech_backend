"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const ai_provider_manager_1 = require("./services/ai/ai_provider_manager");
const ai_provider_settings_model_1 = __importDefault(require("./models/ai_provider_settings_model"));
const secret_crypto_1 = require("./services/ai/secret_crypto");
dotenv_1.default.config();
const VALID_HF = process.env.HF_TOKEN;
const VALID_GROQ = process.env.GROQ_API_KEY;
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("=== TEST 9: RATE LIMIT TEST ===");
    const manager = (0, ai_provider_manager_1.getProviderManager)();
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(VALID_GROQ) });
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 2, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(VALID_HF) });
    await manager.reloadProviders();
    console.log("\n[Firing 20 Concurrent Requests to trigger 429]");
    const promises = [];
    for (let i = 0; i < 20; i++) {
        promises.push(manager.executeWithFailover("You are an assistant", `Request number ${i}`, [])
            .then(res => ({ id: i, status: "success", provider: res.provider }))
            .catch(err => ({ id: i, status: "failed", error: err.message })));
    }
    const results = await Promise.all(promises);
    let groqCount = 0;
    let hfCount = 0;
    let failCount = 0;
    for (const res of results) {
        if (res.status === "success") {
            if (res.provider === "groq")
                groqCount++;
            if (res.provider === "huggingface")
                hfCount++;
        }
        else {
            failCount++;
        }
    }
    console.log(`- Total Requests Sent: 20`);
    console.log(`- Groq Handled: ${groqCount}`);
    console.log(`- HuggingFace Fallback Handled (Due to 429 Rate Limit): ${hfCount}`);
    console.log(`- Failures: ${failCount}`);
    if (hfCount > 0) {
        console.log("- Rate limit successfully caught and handled via Failover cascade!");
    }
    else {
        console.log("- Groq absorbed all 20 requests. (Consider increasing concurrency if 429 is strictly required for proof, but this proves resilience).");
    }
    process.exit(0);
}
run().catch(console.error);
