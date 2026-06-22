import mongoose from "mongoose";
import dotenv from "dotenv";
import { orchestrateChat } from "./services/ai/ai_orchestrator_service";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to DB");

  const start = Date.now();
  console.log("Sending Arabic message to Orchestrator...");
  
  const result = await orchestrateChat({
    userId: "test_user_ar",
    requestId: "trace_ar_" + Date.now(),
    question: "ما هي اعراض لفحة اوراق الطماطم المبكرة؟",
    history: [],
    language: "ar"
  });

  const latency = Date.now() - start;
  
  console.log("\n--- ARABIC TRACE RESULTS ---");
  console.log("Message:", result.message);
  console.log("Provider:", result.provider);
  console.log("Latency:", latency, "ms");

  process.exit(0);
}

run().catch(console.error);
