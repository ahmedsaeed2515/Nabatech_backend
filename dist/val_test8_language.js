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
    console.log("=== TEST 8: LANGUAGE VALIDATION ===");
    const manager = (0, ai_provider_manager_1.getProviderManager)();
    const prompt = "ما هي أعراض لفحة الطماطم المبكرة؟"; // "What are the symptoms of early tomato blight?"
    // Test Groq
    console.log("\n[Testing Groq Language Model]");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(VALID_GROQ) });
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: false });
    await manager.reloadProviders();
    const startGroq = Date.now();
    const resGroq = await manager.executeWithFailover("You are an Arabic agricultural assistant. Respond only in Arabic.", prompt, []);
    console.log(`- Groq Latency: ${Date.now() - startGroq}ms`);
    console.log(`- Groq Provider: ${resGroq.provider}`);
    console.log(`- Groq Arabic Response: ${resGroq.message}`);
    // Test HuggingFace
    console.log("\n[Testing HuggingFace Language Model]");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: false });
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 1, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(VALID_HF), llmModel: "Qwen/Qwen3-32B" });
    await manager.reloadProviders();
    const startHF = Date.now();
    const resHF = await manager.executeWithFailover("You are an Arabic agricultural assistant. Respond only in Arabic.", prompt, []);
    console.log(`- HF Latency: ${Date.now() - startHF}ms`);
    console.log(`- HF Provider: ${resHF.provider}`);
    console.log(`- HF Arabic Response: ${resHF.message}`);
    process.exit(0);
}
run().catch(console.error);
