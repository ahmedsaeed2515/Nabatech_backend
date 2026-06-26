import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import AiSettings from "./models/ai_settings_model";

async function run() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech";
  await mongoose.connect(MONGO_URI);
  
  let settings = await AiSettings.findOne({ key: "default" });
  if (settings) {
    settings.aiModePriority = ["rag_openai", "hf_v8", "hf_v62"];
    await settings.save();
    console.log("Successfully updated AI Settings priority in DB!");
  } else {
    console.log("Settings not found in DB. The app will use the updated ai_config_service.ts defaults.");
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);


