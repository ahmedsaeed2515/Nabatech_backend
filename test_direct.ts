import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { orchestrateAssistantRequest } from './src/services/ai/ai_orchestrator_service';
import fs from 'fs';

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech");
    console.log("Connected to MongoDB.");

    const sampleImagePath = "apple_scab.jpg";
    if (!fs.existsSync(sampleImagePath)) {
        // Create a dummy file if it doesn't exist
        fs.writeFileSync(sampleImagePath, "dummy image content");
    }

    const mockFile = {
      path: sampleImagePath,
      originalname: "apple_scab.jpg",
      mimetype: "image/jpeg"
    } as Express.Multer.File;

    console.log("Starting orchestrateAssistantRequest...");
    const result = await orchestrateAssistantRequest(
      mockFile,
      "What disease is this plant suffering from?",
      "en",
      []
    );

    console.log("--- RESULT ---");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runTest();
