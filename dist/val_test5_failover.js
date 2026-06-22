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
    console.log("=== TEST 5: FAILOVER VALIDATION ===");
    const manager = (0, ai_provider_manager_1.getProviderManager)();
    // Scenario A: Groq enabled, HF enabled -> Expected: Groq handles request
    console.log("\n[Scenario A] Groq and HF enabled");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(VALID_GROQ) });
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 2, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(VALID_HF) });
    await manager.reloadProviders();
    const resA = await manager.executeWithFailover("You are an assistant", "Hello Scenario A", []);
    console.log(`- Expected: groq, Actual: ${resA.provider}`);
    // Scenario B: Groq disabled -> Expected: HF handles request
    console.log("\n[Scenario B] Groq disabled");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: false });
    await manager.reloadProviders();
    const resB = await manager.executeWithFailover("You are an assistant", "Hello Scenario B", []);
    console.log(`- Expected: huggingface, Actual: ${resB.provider}`);
    // Scenario C: Groq invalid key -> Expected: HF handles request
    console.log("\n[Scenario C] Groq invalid key");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)("invalid") });
    await manager.reloadProviders();
    const resC = await manager.executeWithFailover("You are an assistant", "Hello Scenario C", []);
    console.log(`- Expected: huggingface, Actual: ${resC.provider}`);
    // Scenario D: HF invalid key -> Expected: hf-rag-fallback or failure thrown
    console.log("\n[Scenario D] HF invalid key");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)("invalid") });
    // Disable groq totally for this
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: false });
    await manager.reloadProviders();
    try {
        const resD = await manager.executeWithFailover("You are an assistant", "Hello Scenario D", []);
        console.log(`- Fallback caught it! Provider: ${resD.provider}`);
    }
    catch (err) {
        console.log(`- Expected error thrown: ${err.message}`);
    }
    process.exit(0);
}
run().catch(console.error);
