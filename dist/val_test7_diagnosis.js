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
    console.log("=== TEST 7: DIAGNOSIS PIPELINE ===");
    const manager = (0, ai_provider_manager_1.getProviderManager)();
    // Make sure Groq is enabled for this test
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, llmModel: "qwen/qwen3-32b" });
    await manager.reloadProviders();
    console.log("\n[Diagnosis] Simulating image upload...");
    // Create a dummy mock 1x1 image buffer
    const mockBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const start = Date.now();
    try {
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId: "test_user_diag",
            requestId: "trace_diag_1",
            fileBuffer: mockBuffer,
            originalName: "test_leaf.jpg",
            question: "What is wrong with this leaf?",
            history: [],
            language: "en"
        });
        const latency = Date.now() - start;
        console.log(`- Final Answer Provider: ${result.provider}`);
        console.log(`- Provider Chain: ${result.providerChain?.join(" -> ")}`);
        console.log(`- Diagnosis Latency: ${latency}ms`);
        console.log(`- Final Response: ${result.message}`);
        if (result.mode === "diagnosis") {
            console.log(`- CNN Disease Detected: ${result.diseaseName}`);
            console.log(`- CNN Confidence: ${result.confidence}%`);
        }
    }
    catch (err) {
        console.log(`- Diagnosis Pipeline Failed: ${err.message}`);
    }
    process.exit(0);
}
run().catch(console.error);
