import mongoose from "mongoose";
import AiProviderSettings from "./src/models/ai_provider_settings_model";
import { decryptSecret } from "./src/services/ai/secret_crypto";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const providers = await AiProviderSettings.find({});
  for (const p of providers) {
    let dec = "err";
    try {
      dec = p.apiKeyEncrypted ? decryptSecret(p.apiKeyEncrypted).substring(0, 15) : "none";
    } catch(e) {}
    console.log(p.providerName, "- decrypted:", dec, "- model:", p.llmModel);
  }
  process.exit(0);
}
run();
