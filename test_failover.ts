import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import AiProviderSettings from './src/models/ai_provider_settings_model';
import { getProviderManager } from './src/services/ai/ai_provider_manager';
import { encryptSecret } from './src/services/ai/secret_crypto';

async function seedAndTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech");
    console.log("Connected to MongoDB");

    await AiProviderSettings.deleteMany({});
    
    // Seed providers
    await AiProviderSettings.create([
      {
        providerName: "openrouter",
        enabled: true,
        priority: 1,
        defaultProvider: true,
        apiKeyEncrypted: encryptSecret("dummy-openrouter-key"), // Intentional dummy for failover
        llmModel: "openai/gpt-4o",
        baseUrl: "https://openrouter.ai/api/v1/chat/completions"
      },
      {
        providerName: "gemini",
        enabled: true,
        priority: 2,
        apiKeyEncrypted: encryptSecret("dummy-gemini-key"),
        llmModel: "gemini-2.5-pro",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
      },
      {
        providerName: "openai",
        enabled: true,
        priority: 3,
        apiKeyEncrypted: encryptSecret("dummy-openai-key"),
        llmModel: "gpt-4o-mini",
        baseUrl: "https://api.openai.com/v1/chat/completions"
      },
      {
        providerName: "huggingface",
        enabled: true,
        priority: 4,
        apiKeyEncrypted: "",
        llmModel: "qwen",
        baseUrl: "https://ahmedsaeed111-rag-only.hf.space/ask" // The fallback that will actually succeed
      }
    ]);
    console.log("Seeded AI Providers");

    const manager = getProviderManager();
    await manager.reloadProviders();

    console.log("Starting Execution With Failover...");
    
    const result = await manager.executeWithFailover(
      "You are a helpful AI.",
      "Hello, world!",
      []
    );

    console.log("--- RESULT ---");
    console.log("Final Provider Used:", result.provider);
    console.log("Message:", result.message);
    
    // Check Health statuses in DB
    const providers = await AiProviderSettings.find().sort({ priority: 1 });
    console.log("\n--- PROVIDER HEALTH STATUSES ---");
    providers.forEach(p => {
      console.log(`${p.providerName}: ${p.status} | Last Error: ${p.lastError || 'None'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

seedAndTest();
