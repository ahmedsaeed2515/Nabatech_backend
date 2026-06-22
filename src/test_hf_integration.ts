import mongoose from "mongoose";
import dotenv from "dotenv";
import { getProviderManager } from "./services/ai/ai_provider_manager";
import AiProviderSettings from "./models/ai_provider_settings_model";
import { encryptSecret } from "./services/ai/secret_crypto";
import { orchestrateChat } from "./services/ai/ai_orchestrator_service";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN as string;

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB for Testing...");

  const manager = getProviderManager();

  console.log("\n--- TEST 1: Valid HF Token ---");
  // Ensure huggingface is priority 4 and valid
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "huggingface" },
    { enabled: true, apiKeyEncrypted: encryptSecret(HF_TOKEN), status: "unknown" }
  );
  await manager.reloadProviders();
  const test1 = await manager.executeWithFailover("You are an assistant", "Hello from Test 1", []);
  console.log("Test 1 Result:", test1.provider, "->", test1.message.substring(0, 50));

  console.log("\n--- TEST 2: Invalid Token & Failover ---");
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "huggingface" },
    { enabled: true, apiKeyEncrypted: encryptSecret("invalid_token"), status: "unknown" }
  );
  // Disable all others except huggingface and hf-rag-fallback to isolate
  await AiProviderSettings.updateMany(
    { providerName: { $nin: ["huggingface", "hf-rag-fallback"] } },
    { enabled: false }
  );
  await manager.reloadProviders();
  try {
    const test2 = await manager.executeWithFailover("You are an assistant", "Hello from Test 2", []);
    console.log("Test 2 Result (Failover Provider):", test2.provider);
  } catch (err: any) {
    console.log("Test 2 Failed:", err.message);
  }

  console.log("\n--- TEST 3: Provider Disabled ---");
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "huggingface" },
    { enabled: false }
  );
  await manager.reloadProviders();
  const hfStatus = manager.getProviders().find(p => p.providerName === "huggingface");
  console.log("Test 3 HF Provider Found in active list?:", !!hfStatus);

  console.log("\n--- TEST 4: Model Switch ---");
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "huggingface" },
    { enabled: true, llmModel: "moonshotai/Kimi-K2-Instruct-0905", apiKeyEncrypted: encryptSecret(HF_TOKEN), status: "unknown" }
  );
  await manager.reloadProviders();
  const test4 = await manager.executeWithFailover("You are an assistant", "Hello from Test 4", []);
  console.log("Test 4 Model Used (indirect verification):", test4.provider);

  console.log("\n--- TEST 5: Groq Failure -> HF Execution ---");
  // Set Groq to invalid token and Priority 1, HF to valid token and Priority 2
  await AiProviderSettings.updateMany({}, { enabled: false });
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "groq" },
    { enabled: true, priority: 1, apiKeyEncrypted: encryptSecret("invalid_groq") }
  );
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "huggingface" },
    { enabled: true, priority: 2, apiKeyEncrypted: encryptSecret(HF_TOKEN) }
  );
  await manager.reloadProviders();
  const test5 = await manager.executeWithFailover("You are an assistant", "Hello from Test 5", []);
  console.log("Test 5 Executed Provider:", test5.provider);

  process.exit(0);
}

runTests().catch(console.error);
