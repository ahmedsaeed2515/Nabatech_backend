import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

// Ensure models are registered
import './src/models/user_model';
import './src/models/plant_model';
import './src/models/plant_dna_model';
import './src/models/garden_model';
import './src/models/zone_model';

import { orchestrateAssistantRequest } from './src/services/ai/ai_orchestrator_service';
import * as cnn_provider from './src/services/ai/cnn_provider';

// Force high confidence so it hits the add_plant_to_garden flow
(cnn_provider as any).runCnnDiagnosis = async () => {
  return {
    prediction: "Tomato___Early_blight",
    confidence: 0.99,
    candidates: [],
    provider: "mock"
  };
};

async function runTest() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nabatech');
  
  const User = mongoose.model('User');
  let user = await User.findOne({ email: 'test_diagnosis_runtime@example.com' });
  if (!user) {
    user = await User.create({ name: 'Test User', email: 'test_diagnosis_runtime@example.com', passwordHash: 'hashedpassword123', role: 'user' });
  }

  const tinyGifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const fileBuffer = Buffer.from(tinyGifBase64, 'base64');
  
  console.log("Starting orchestrateAssistantRequest with user:", user._id.toString());
  
  try {
    const result = await orchestrateAssistantRequest({
      userId: user._id.toString(),
      fileBuffer: fileBuffer,
      originalName: "test_runtime_image.gif",
      history: [],
      question: "What is wrong with my plant? Please save it.",
    });
    console.log("\n[TEST RESULT] Final Response:", JSON.stringify(result, null, 2));

    if (!result.toolCalls || result.toolCalls.length === 0) {
      console.log("\n[DEBUG_RUNTIME] LLM skipped the tool call. Manually invoking AgentToolRegistry for runtime verification logs...");
      const { AgentToolRegistry } = await import('./src/services/ai/agent_tool_registry');
      const registry = new AgentToolRegistry();
      const unknownResponse = await registry.executeTool("add_plant_to_garden", { plantName: "Dragonfruit", imageUrl: "test_runtime_image.gif" }, user._id.toString());
      console.log("\n[TEST RESULT] Unknown Plant Response:", unknownResponse);
    }

  } catch (error) {
    console.error("Error running request:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

runTest();
