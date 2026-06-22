const mongoose = require("mongoose");
const AiProviderSettings = require("./src/models/ai_provider_settings_model").default;
const dotenv = require("dotenv");
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const providers = await AiProviderSettings.find({});
  for (const p of providers) {
    console.log(p.providerName, "- key len:", p.apiKeyEncrypted ? p.apiKeyEncrypted.length : "none", "- model:", p.llmModel);
  }
  process.exit(0);
}
run();
