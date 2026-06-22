import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { runCnnDiagnosis } from "./services/ai/cnn_provider";
import { getAiSettings } from "./services/ai/ai_config_service";
import FormData from "form-data";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const settings = await getAiSettings();

  const files = ["tomato.jpg", "test.jpg", "potato.jpg"];
  for (const f of files) {
    const p = path.join(__dirname, "../", f);
    if (!fs.existsSync(p)) continue;
    const buf = fs.readFileSync(p);
    if (buf.length === 0) continue;
    
    const formData = new FormData();
    formData.append("file", buf, { filename: f });
    try {
      const res = await runCnnDiagnosis(settings, formData, formData.getHeaders());
      console.log(`${f}: ${res.prediction} (${res.confidence}%)`);
    } catch (e: any) {
      console.log(`${f} failed: ${e.message}`);
    }
  }
  process.exit(0);
}

run().catch(console.error);
