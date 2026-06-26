import mongoose from "mongoose";
import dotenv from "dotenv";
import { getProviderManager } from "./services/ai/ai_provider_manager";
import AiProviderSettings from "./models/ai_provider_settings_model";
import { orchestrateAssistantRequest } from "./services/ai/ai_orchestrator_service";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("=== TEST 7: DIAGNOSIS PIPELINE ===");
  
  const manager = getProviderManager();
  
  // Make sure Groq is enabled for this test
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "groq" },
    { enabled: true, priority: 1, llmModel: "qwen/qwen3-32b" }
  );
  await manager.reloadProviders();

  console.log("\n[Diagnosis] Simulating image upload...");
  // Create a dummy mock 1x1 image buffer
  const mockBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );

  const start = Date.now();
  try {
    const result = await orchestrateAssistantRequest({
      userId: "test_user_diag",
      requestId: "trace_diag_1",
      fileBuffer: mockBuffer,
      originalName: "test_leaf.jpg",
      question: "What is wrong with this leaf?",
      history: [],
      language: "en"
    });

    const latency = Date.now() - start;
    
    console.log(`- Final Answer Provider: ${result.provider}`);
    console.log(`- Provider Chain: ${result.providerChain?.join(" -> ")}`);
    console.log(`- Diagnosis Latency: ${latency}ms`);
    console.log(`- Final Response: ${result.message}`);
    if (result.mode === "diagnosis") {
      console.log(`- CNN Disease Detected: ${result.diseaseName}`);
      console.log(`- CNN Confidence: ${result.confidence}%`);
    }
  } catch (err: any) {
    console.log(`- Diagnosis Pipeline Failed: ${err.message}`);
  }

  process.exit(0);
}

run().catch(console.error);


