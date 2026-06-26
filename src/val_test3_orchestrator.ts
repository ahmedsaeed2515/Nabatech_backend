import mongoose from "mongoose";
import dotenv from "dotenv";
import { orchestrateChat } from "./services/ai/ai_orchestrator_service";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("=== TEST 3: ORCHESTRATOR TEST ===");
  
  const start = Date.now();
  console.log("Sending request to Orchestrator...");
  try {
    const result = await orchestrateChat({
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
  } catch (err: any) {
    console.log("- Orchestrator Failed:", err.message);
  }

  process.exit(0);
}

run().catch(console.error);


