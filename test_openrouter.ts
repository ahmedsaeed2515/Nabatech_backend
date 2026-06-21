import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { getProviderManager } from "./src/services/ai/ai_provider_manager";
import AiProviderSettings from "./src/models/ai_provider_settings_model";
import { encryptSecret } from "./src/services/ai/secret_crypto";

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech");
  console.log("Connected to MongoDB");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("No OPENROUTER_API_KEY found in environment!");
  } else {
    console.log("Found OPENROUTER_API_KEY in environment.");
  }

  // Set OpenRouter as the ONLY enabled provider and give it the real API key
  await AiProviderSettings.deleteMany({});
  await AiProviderSettings.create({
    providerName: "openrouter",
    enabled: true,
    priority: 1,
    defaultProvider: true,
    apiKeyEncrypted: apiKey ? encryptSecret(apiKey) : encryptSecret("dummy-key"),
    llmModel: "openai/gpt-4o-mini", // fallback model
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    status: "unknown"
  });

  const manager = getProviderManager();
  await manager.reloadProviders();

  console.log("Starting OpenRouter Request...");
  try {
    const start = Date.now();
    const result = await manager.executeWithFailover("You are a helpful assistant.", "What is the capital of France?", []);
    const end = Date.now();
    console.log("--- RESULT ---");
    console.log(`Provider: ${result.provider}`);
    console.log(`Latency: ${end - start}ms`);
    console.log(`Message: ${result.message}`);
    
    // Check call logs
    const ai_call_log_model = await import("./src/models/ai_call_log_model");
    const AiCallLog = ai_call_log_model.default;
    const log = await AiCallLog.findOne().sort({ createdAt: -1 });
    console.log("--- LATEST LOG ENTRY ---");
    if (log) {
      console.log(`Provider Logged: ${log.provider}`);
      console.log(`Cost: ${log.cost}`);
      console.log(`Tokens Used: ${log.tokensUsed}`);
      console.log(`Latency Logged: ${log.latencyMs}`);
      console.log(`Success: ${log.status}`);
    }
  } catch (error: any) {
    console.error("Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
