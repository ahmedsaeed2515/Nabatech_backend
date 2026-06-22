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
    console.log("Connected to DB");
    const start = Date.now();
    console.log("Sending message to Orchestrator...");
    const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
        userId: "test_user_123",
        requestId: "trace_" + Date.now(),
        question: "What are the symptoms of tomato leaf blight?",
        history: [],
        language: "en"
    });
    const latency = Date.now() - start;
    console.log("\n--- TRACE RESULTS ---");
    console.log("Message:", result.message);
    console.log("Source:", result.source);
    console.log("Provider:", result.provider);
    console.log("Latency:", latency, "ms");
    process.exit(0);
}
run().catch(console.error);
