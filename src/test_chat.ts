import mongoose from "mongoose";
import dotenv from "dotenv";
import { orchestrateChat } from "./services/ai/ai_orchestrator_service";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to DB");

  const start = Date.now();
  console.log("Sending message to Orchestrator...");
  
  const result = await orchestrateChat({
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


