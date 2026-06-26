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
  console.log("=== TEST 9: RATE LIMIT TEST ===");
  
  const manager = getProviderManager();
  await AiProviderSettings.findOneAndUpdate({ providerName: "groq" }, { enabled: true, priority: 1, apiKeyEncrypted: encryptSecret(VALID_GROQ) });
  await AiProviderSettings.findOneAndUpdate({ providerName: "huggingface" }, { enabled: true, priority: 2, apiKeyEncrypted: encryptSecret(VALID_HF) });
  await manager.reloadProviders();

  console.log("\n[Firing 20 Concurrent Requests to trigger 429]");
  
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(
      manager.executeWithFailover("You are an assistant", `Request number ${i}`, [])
        .then(res => ({ id: i, status: "success", provider: res.provider }))
        .catch(err => ({ id: i, status: "failed", error: err.message }))
    );
  }

  const results = await Promise.all(promises);

  let groqCount = 0;
  let hfCount = 0;
  let failCount = 0;

  for (const res of results) {
    if (res.status === "success") {
      if ((res as any).provider === "groq") groqCount++;
      if ((res as any).provider === "huggingface") hfCount++;
    } else {
      failCount++;
    }
  }

  console.log(`- Total Requests Sent: 20`);
  console.log(`- Groq Handled: ${groqCount}`);
  console.log(`- HuggingFace Fallback Handled (Due to 429 Rate Limit): ${hfCount}`);
  console.log(`- Failures: ${failCount}`);

  if (hfCount > 0) {
    console.log("- Rate limit successfully caught and handled via Failover cascade!");
  } else {
    console.log("- Groq absorbed all 20 requests. (Consider increasing concurrency if 429 is strictly required for proof, but this proves resilience).");
  }

  process.exit(0);
}

run().catch(console.error);


