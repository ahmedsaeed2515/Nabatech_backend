"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("=== TEST 6: LOGGING VALIDATION ===");
    const AiCallLog = mongoose_1.default.connection.collection("aicalllogs");
    // Fetch the 5 most recent logs
    const logs = await AiCallLog.find().sort({ createdAt: -1 }).limit(5).toArray();
    for (const log of logs) {
        console.log(`\nLog ID: ${log._id}`);
        console.log(`- Provider Used: ${log.provider}`);
        console.log(`- Model Used: ${log.model}`);
        console.log(`- Latency: ${log.latencyMs}ms`);
        console.log(`- Success Status: ${log.status}`);
        if (log.error) {
            console.log(`- Error Logged: ${log.error}`);
        }
        console.log(`- Timestamp: ${log.createdAt}`);
    }
    process.exit(0);
}
run().catch(console.error);
