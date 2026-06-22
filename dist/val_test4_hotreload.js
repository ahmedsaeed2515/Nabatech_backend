"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const ai_provider_manager_1 = require("./services/ai/ai_provider_manager");
const ai_provider_settings_model_1 = __importDefault(require("./models/ai_provider_settings_model"));
const ai_orchestrator_service_1 = require("./services/ai/ai_orchestrator_service");
dotenv_1.default.config();
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("=== TEST 4: DASHBOARD HOT RELOAD ===");
    const manager = (0, ai_provider_manager_1.getProviderManager)();
    // Step 1: Ensure Groq is primary with a specific model
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, llmModel: "qwen/qwen3-32b", priority: 1 });
    await manager.reloadProviders();
    console.log("\n[Initial Request] Using Qwen model via Groq...");
    const result1 = await (0, ai_orchestrator_service_1.orchestrateChat)({
        userId: "test_user_hot",
        requestId: "trace_hot_1",
        question: "Respond with exactly one word: 'Qwen' or 'Llama' based on what model you are.",
        history: [],
        language: "en"
    });
    console.log(`- Request 1 Provider: ${result1.provider}`);
    console.log(`- Request 1 Response: ${result1.message.trim()}`);
    // Step 2: Simulate Dashboard "Save" changing the model without restart
    console.log("\n[Simulating Dashboard Update] Changing Groq model to 'llama-3.3-70b-versatile'...");
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { llmModel: "llama-3.3-70b-versatile" });
    // The exact logic the controller fires:
    await manager.reloadProviders();
    console.log("\n[Second Request] Verifying new model takes effect dynamically...");
    const result2 = await (0, ai_orchestrator_service_1.orchestrateChat)({
        userId: "test_user_hot",
        requestId: "trace_hot_2",
        question: "Respond with exactly one word: 'Qwen' or 'Llama' based on what model you are.",
        history: [],
        language: "en"
    });
    console.log(`- Request 2 Provider: ${result2.provider}`);
    console.log(`- Request 2 Response: ${result2.message.trim()}`);
    process.exit(0);
}
run().catch(console.error);
