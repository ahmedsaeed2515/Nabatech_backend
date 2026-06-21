require("ts-node").register();
const mongoose = require("mongoose");
const { encryptSecret } = require("./src/services/ai/secret_crypto");
require("dotenv").config();

const AiProviderSettingsSchema = new mongoose.Schema({
  providerName: String,
  baseUrl: String,
  apiKeyEncrypted: String,
  model: String,
  enabled: Boolean,
  priority: Number,
  isFallback: Boolean,
  maxTokens: Number,
  temperature: Number
});

const AiProviderSettings = mongoose.model("AiProviderSettings", AiProviderSettingsSchema, "aiprovidersettings");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const apiKey = "sk-cBwFVPLvWWSo8EcOGm6FWVOUpsdlQpQ4rGO7dqD6a78ZnHF8";
  const encryptedKey = encryptSecret(apiKey);

  // Disable others
  await AiProviderSettings.updateMany({}, { $set: { enabled: false } });

  const models = [
    { name: "deepseek-v4-flash", priority: 1, pName: "agentrouter-flash" },
    { name: "deepseek-v4-pro", priority: 2, pName: "agentrouter-pro" },
    { name: "glm-5.1", priority: 3, pName: "agentrouter-glm" }
  ];

  for (const m of models) {
    await AiProviderSettings.findOneAndUpdate(
      { providerName: m.pName },
      {
        providerName: m.pName,
        baseUrl: "https://agentrouter.org/v1",
        apiKeyEncrypted: encryptedKey,
        model: m.name,
        enabled: true,
        priority: m.priority,
        isFallback: false,
        maxTokens: 2000,
        temperature: 0.7
      },
      { upsert: true, new: true }
    );
    console.log(`Configured ${m.name} as ${m.pName}`);
  }

  // Also add hf-rag-fallback as fallback
  await AiProviderSettings.findOneAndUpdate(
    { providerName: "hf-rag-fallback" },
    {
      providerName: "hf-rag-fallback",
      baseUrl: "internal",
      apiKeyEncrypted: encryptSecret("none"),
      model: "hf-rag-fallback",
      enabled: true,
      priority: 99,
      isFallback: true
    },
    { upsert: true }
  );

  console.log("Done");
  process.exit(0);
}

run().catch(console.error);
