import mongoose from "mongoose";
import dotenv from "dotenv";
import { getProviderManager } from "./services/ai/ai_provider_manager";
import AiProviderSettings from "./models/ai_provider_settings_model";
import { encryptSecret } from "./services/ai/secret_crypto";

dotenv.config();

const VALID_HF = process.env.HF_TOKEN as string;
const VALID_GROQ = process.env.GROQ_API_KEY as string;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("=== TEST 5: FAILOVER VALIDATION ===");
  
  const manager = getProviderManager();

  // Scenario A: Groq enabled, HF enabled -> Expected: Groq handles request
  console.log("\n[Scenario A] Groq and HF enabled");
  await AiProviderSettings.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, apiKeyEncrypted: encryptSecret(VALID_GROQ) });
  await AiProviderSettings.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 2, apiKeyEncrypted: encryptSecret(VALID_HF) });
  await manager.reloadProviders();
  const resA = await manager.executeWithFailover("You are an assistant", "Hello Scenario A", []);
  console.log(`- Expected: groq, Actual: ${resA.provider}`);

  // Scenario B: Groq disabled -> Expected: HF handles request
  console.log("\n[Scenario B] Groq disabled");
  await AiProviderSettings.findOneAndUpdate({ providerName: "groq" }, { enabled: false });
  await manager.reloadProviders();
  const resB = await manager.executeWithFailover("You are an assistant", "Hello Scenario B", []);
  console.log(`- Expected: huggingface, Actual: ${resB.provider}`);

  // Scenario C: Groq invalid key -> Expected: HF handles request
  console.log("\n[Scenario C] Groq invalid key");
  await AiProviderSettings.findOneAndUpdate({ providerName: "groq" }, { enabled: true, apiKeyEncrypted: encryptSecret("invalid") });
  await manager.reloadProviders();
  const resC = await manager.executeWithFailover("You are an assistant", "Hello Scenario C", []);
  console.log(`- Expected: huggingface, Actual: ${resC.provider}`);

  // Scenario D: HF invalid key -> Expected: hf-rag-fallback or failure thrown
  console.log("\n[Scenario D] HF invalid key");
  await AiProviderSettings.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, apiKeyEncrypted: encryptSecret("invalid") });
  // Disable groq totally for this
  await AiProviderSettings.findOneAndUpdate({ providerName: "groq" }, { enabled: false });
  await manager.reloadProviders();
  try {
    const resD = await manager.executeWithFailover("You are an assistant", "Hello Scenario D", []);
    console.log(`- Fallback caught it! Provider: ${resD.provider}`);
  } catch (err: any) {
    console.log(`- Expected error thrown: ${err.message}`);
  }

  process.exit(0);
}

run().catch(console.error);


