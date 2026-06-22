import mongoose from "mongoose";
import AiProviderSettings from "./src/models/ai_provider_settings_model";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const providers = await AiProviderSettings.find({});
  for (const p of providers) {
    console.log(p.providerName, "- key len:", p.apiKeyEncrypted ? p.apiKeyEncrypted.length : "none", "- model:", p.llmModel);
  }
  process.exit(0);
}
run();
