import mongoose from "mongoose";
import dotenv from "dotenv";
import { orchestrateAssistantRequest } from "./src/services/ai/ai_orchestrator_service";

dotenv.config();

async function runTest() {
  try {
    console.log("Testing orchestrator...");
    const result = await orchestrateAssistantRequest({
      userId: new mongoose.Types.ObjectId().toString(),
      question: "كيف أعالج الآفة المبكرة في البطاطس؟",
      history: [],
      topK: 3,
      skipAdvice: false,
    });
    console.log("Result:", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runTest();
