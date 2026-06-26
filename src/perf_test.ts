import mongoose from "mongoose";
import dotenv from "dotenv";
import { orchestrateChat } from "./services/ai/ai_orchestrator_service";

dotenv.config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech");
    console.log("Connected to MongoDB.");

    console.log("\n--- STARTING AI PERFORMANCE TEST ---");
    const tStart = performance.now();
    
    const result = await orchestrateChat({
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
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

runTest();
