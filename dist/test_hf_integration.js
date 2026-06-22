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
const HF_TOKEN = process.env.HF_TOKEN;
async function runTests() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for Testing...");
    const manager = (0, ai_provider_manager_1.getProviderManager)();
    console.log("\n--- TEST 1: Valid HF Token ---");
    // Ensure huggingface is priority 4 and valid
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(HF_TOKEN), status: "unknown" });
    await manager.reloadProviders();
    const test1 = await manager.executeWithFailover("You are an assistant", "Hello from Test 1", []);
    console.log("Test 1 Result:", test1.provider, "->", test1.message.substring(0, 50));
    console.log("\n--- TEST 2: Invalid Token & Failover ---");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)("invalid_token"), status: "unknown" });
    // Disable all others except huggingface and hf-rag-fallback to isolate
    await ai_provider_settings_model_1.default.updateMany({ providerName: { $nin: ["huggingface", "hf-rag-fallback"] } }, { enabled: false });
    await manager.reloadProviders();
    try {
        const test2 = await manager.executeWithFailover("You are an assistant", "Hello from Test 2", []);
        console.log("Test 2 Result (Failover Provider):", test2.provider);
    }
    catch (err) {
        console.log("Test 2 Failed:", err.message);
    }
    console.log("\n--- TEST 3: Provider Disabled ---");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: false });
    await manager.reloadProviders();
    const hfStatus = manager.getProviders().find(p => p.providerName === "huggingface");
    console.log("Test 3 HF Provider Found in active list?:", !!hfStatus);
    console.log("\n--- TEST 4: Model Switch ---");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, llmModel: "moonshotai/Kimi-K2-Instruct-0905", apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(HF_TOKEN), status: "unknown" });
    await manager.reloadProviders();
    const test4 = await manager.executeWithFailover("You are an assistant", "Hello from Test 4", []);
    console.log("Test 4 Model Used (indirect verification):", test4.provider);
    console.log("\n--- TEST 5: Groq Failure -> HF Execution ---");
    // Set Groq to invalid token and Priority 1, HF to valid token and Priority 2
    await ai_provider_settings_model_1.default.updateMany({}, { enabled: false });
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)("invalid_groq") });
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 2, apiKeyEncrypted: (0, secret_crypto_1.encryptSecret)(HF_TOKEN) });
    await manager.reloadProviders();
    const test5 = await manager.executeWithFailover("You are an assistant", "Hello from Test 5", []);
    console.log("Test 5 Executed Provider:", test5.provider);
    process.exit(0);
}
runTests().catch(console.error);
