import mongoose from "mongoose";
import dotenv from "dotenv";
import AiSettings from "./src/models/ai_settings_model";
import { getAiSettings, updateAiSettings } from "./src/services/ai/ai_config_service";

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nabatech");
  console.log("Connected to DB");

  const before = await getAiSettings();
  console.log("Before:", before.aiModePriority);

  await updateAiSettings({ aiModePriority: ["hf_v8", "hf_v62", "rag_openai", "hf_grok"] });
  
  const after = await getAiSettings();
  console.log("After:", after.aiModePriority);

  await mongoose.disconnect();
};

test().catch(console.error);
