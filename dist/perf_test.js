"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const ai_orchestrator_service_1 = require("./services/ai/ai_orchestrator_service");
dotenv_1.default.config();
const runTest = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech");
        console.log("Connected to MongoDB.");
        console.log("\n--- STARTING AI PERFORMANCE TEST ---");
        const tStart = performance.now();
        const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
            userId: "test-user",
            requestId: "perf-test-1",
            question: "My plant is diagnosed with Apple Scab. What treatment or advice do you recommend?",
            history: [],
            topK: 4,
            language: "en"
        });
        const tEnd = performance.now();
        console.log("\n--- TEST COMPLETE ---");
        console.log(`Total End-to-End Orchestrator Time: ${(tEnd - tStart).toFixed(2)}ms`);
        console.log("Result Source:", result.source);
        console.log("Result Provider:", result.provider);
        process.exit(0);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
};
runTest();
