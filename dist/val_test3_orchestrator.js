"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const ai_orchestrator_service_1 = require("./services/ai/ai_orchestrator_service");
dotenv_1.default.config();
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("=== TEST 3: ORCHESTRATOR TEST ===");
    const start = Date.now();
    console.log("Sending request to Orchestrator...");
    try {
        const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
            userId: "test_user_orch",
            requestId: "trace_orch_" + Date.now(),
            question: "Hello from Nabatech Validation. Are you receiving this?",
            history: [],
            language: "en"
        });
        const latency = Date.now() - start;
        console.log(`- Actual Provider Selected: ${result.provider}`);
        console.log(`- Response Generated: ${result.message}`);
        console.log(`- Source chain: ${result.source}`);
        console.log(`- Latency: ${latency}ms`);
    }
    catch (err) {
        console.log("- Orchestrator Failed:", err.message);
    }
    process.exit(0);
}
run().catch(console.error);
