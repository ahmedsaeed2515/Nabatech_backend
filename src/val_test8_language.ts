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
  console.log("=== TEST 8: LANGUAGE VALIDATION ===");
  
  const manager = getProviderManager();
  
  const prompt = "ما هي أعراض لفحة الطماطم المبكرة؟"; // "What are the symptoms of early tomato blight?"
  
  // Test Groq
  console.log("\n[Testing Groq Language Model]");
  await AiProviderSettings.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, apiKeyEncrypted: encryptSecret(VALID_GROQ) });
  await AiProviderSettings.findOneAndUpdate({ providerName: "huggingface" }, { enabled: false });
  await manager.reloadProviders();
  
  const startGroq = Date.now();
  const resGroq = await manager.executeWithFailover("You are an Arabic agricultural assistant. Respond only in Arabic.", prompt, []);
  console.log(`- Groq Latency: ${Date.now() - startGroq}ms`);
  console.log(`- Groq Provider: ${resGroq.provider}`);
  console.log(`- Groq Arabic Response: ${resGroq.message}`);

  // Test HuggingFace
  console.log("\n[Testing HuggingFace Language Model]");
  await AiProviderSettings.findOneAndUpdate({ providerName: "groq" }, { enabled: false });
  await AiProviderSettings.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 1, apiKeyEncrypted: encryptSecret(VALID_HF), llmModel: "Qwen/Qwen3-32B" });
  await manager.reloadProviders();
  
  const startHF = Date.now();
  const resHF = await manager.executeWithFailover("You are an Arabic agricultural assistant. Respond only in Arabic.", prompt, []);
  console.log(`- HF Latency: ${Date.now() - startHF}ms`);
  console.log(`- HF Provider: ${resHF.provider}`);
  console.log(`- HF Arabic Response: ${resHF.message}`);

  process.exit(0);
}

run().catch(console.error);
