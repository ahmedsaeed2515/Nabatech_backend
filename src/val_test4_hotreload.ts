import mongoose from "mongoose";
import dotenv from "dotenv";
import { getProviderManager } from "./services/ai/ai_provider_manager";
import AiProviderSettings from "./models/ai_provider_settings_model";
import { orchestrateChat } from "./services/ai/ai_orchestrator_service";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("=== TEST 4: DASHBOARD HOT RELOAD ===");
  
  const manager = getProviderManager();
  
  // Step 1: Ensure Groq is primary with a specific model
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "groq" },
    { enabled: true, llmModel: "qwen/qwen3-32b", priority: 1 }
  );
  await manager.reloadProviders();

  console.log("\n[Initial Request] Using Qwen model via Groq...");
  const result1 = await orchestrateChat({
    userId: "test_user_hot",
    requestId: "trace_hot_1",
    question: "Respond with exactly one word: 'Qwen' or 'Llama' based on what model you are.",
    history: [],
    language: "en"
  });
  console.log(`- Request 1 Provider: ${result1.provider}`);
  console.log(`- Request 1 Response: ${result1.message.trim()}`);

  // Step 2: Simulate Dashboard "Save" changing the model without restart
  console.log("\n[Simulating Dashboard Update] Changing Groq model to 'llama-3.3-70b-versatile'...");
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "groq" },
    { llmModel: "llama-3.3-70b-versatile" }
  );
  
  // The exact logic the controller fires:
  await manager.reloadProviders();

  console.log("\n[Second Request] Verifying new model takes effect dynamically...");
  const result2 = await orchestrateChat({
    userId: "test_user_hot",
    requestId: "trace_hot_2",
    question: "Respond with exactly one word: 'Qwen' or 'Llama' based on what model you are.",
    history: [],
    language: "en"
  });
  console.log(`- Request 2 Provider: ${result2.provider}`);
  console.log(`- Request 2 Response: ${result2.message.trim()}`);

  process.exit(0);
}

run().catch(console.error);
