import mongoose from 'mongoose';
import { getAiSettings } from './src/services/ai/ai_config_service';

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ahmedsaeed2515:z5L6N4Nn7GqLzGIf@cluster0.k54b0.mongodb.net/nabatech?retryWrites=true&w=majority&appName=Cluster0');
  const settings = await getAiSettings();
  console.log("LLM POOL:", JSON.stringify(settings.llm.pool, null, 2));
  console.log("PIPELINE:", JSON.stringify(settings.pipeline, null, 2));
  console.log("LLM ENABLED:", settings.llm.enabled);
  console.log("LLM PROVIDER:", settings.llm.provider);
  process.exit(0);
}

run().catch(console.error);
