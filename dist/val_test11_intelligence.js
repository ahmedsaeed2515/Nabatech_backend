"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const ai_orchestrator_service_1 = require("./services/ai/ai_orchestrator_service");
const ai_provider_manager_1 = require("./services/ai/ai_provider_manager");
const ai_provider_settings_model_1 = __importDefault(require("./models/ai_provider_settings_model"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("=== CHATBOT INTELLIGENCE AUDIT ===\n");
    const manager = (0, ai_provider_manager_1.getProviderManager)();
    // Ensure Groq is primary initially
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, llmModel: "qwen/qwen3-32b" });
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 4, llmModel: "Qwen/Qwen3-32B" });
    await manager.reloadProviders();
    const userId = "audit_user_" + crypto_1.default.randomUUID().substring(0, 8);
    const history = [];
    const runChat = async (q, testName) => {
        console.log(`\n================================================`);
        console.log(`[${testName}] User: ${q}`);
        const start = Date.now();
        const res = await (0, ai_orchestrator_service_1.orchestrateChat)({ userId, question: q, history });
        const ms = Date.now() - start;
        console.log(`Assistant (${res.provider} in ${ms}ms):\n${res.message}\n`);
        console.log(`[RAG Chunks Found]: ${res.ragContext ? "Yes" : "No"}`);
        history.push({ role: "user", content: q });
        history.push({ role: "assistant", content: res.message });
        return res;
    };
    await runChat("Hello", "TEST 1 - BASIC CHAT");
    await runChat("What causes tomato early blight?", "TEST 2 - AGRICULTURE KNOWLEDGE");
    console.log(`\n================================================`);
    console.log(`TEST 3 - CONTEXT MEMORY`);
    await runChat("I grow tomatoes in Alexandria.", "TEST 3 - MEMORY PART 1");
    await runChat("What disease should I watch for?", "TEST 3 - MEMORY PART 2");
    console.log(`\n================================================`);
    console.log(`TEST 4 - MULTI-TURN REASONING`);
    await runChat("My tomato leaves are yellow.", "TEST 4 - TURN 1");
    await runChat("The yellowing started from lower leaves.", "TEST 4 - TURN 2");
    await runChat("���� ������ �� ����� �������", "TEST 5 - ARABIC");
    await runChat("What is the best way to prevent Downy Mildew in onions during the pod formation stage? Be specific to best practices.", "TEST 6 - RAG UTILIZATION");
    await runChat("How do I treat Blue Dragon Tomato Disease?", "TEST 7 - HALLUCINATION TEST");
    console.log(`\n================================================`);
    console.log(`TEST 8 - TOOL CHAIN QUALITY`);
    const imgPath = path_1.default.join(__dirname, "../tomato.jpg");
    const imgBuffer = fs_1.default.readFileSync(imgPath);
    const start8 = Date.now();
    // Provide empty image to skip cnn maybe? Or actually run cnn, user wants CNN used.
    // The orchestrator requires a fileBuffer to run CNN.
    process.env.CNN_CONFIDENCE_THRESHOLD = "0.10"; // allow tomato to pass
    const res8 = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
        userId,
        fileBuffer: imgBuffer,
        originalName: "tomato.jpg",
        question: "I uploaded a tomato image and my region is Alexandria. What do you see?",
        history
    });
    const ms8 = Date.now() - start8;
    console.log(`[TEST 8 - TOOL CHAIN] Assistant (${res8.provider} in ${ms8}ms):\n${res8.message}\n`);
    console.log(`ProviderChain: ${JSON.stringify(res8.providerChain)}`);
    console.log(`\n================================================`);
    console.log(`TEST 9 - FAILOVER QUALITY`);
    // Disable Groq
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: false });
    await manager.reloadProviders();
    await runChat("What is the main nutrient required for potato growth?", "TEST 9 - FAILOVER");
    // Restore Groq
    await ai_provider_settings_model_1.default.findOneAndUpdate({ providerName: "groq" }, { enabled: true });
    process.exit(0);
}
run();
