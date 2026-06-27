require('dotenv').config();
const mongoose = require('mongoose');

// Use ts-node to run the TypeScript module
require('ts-node').register({ transpileOnly: true });
const { orchestrateChat } = require('./src/services/ai/ai_orchestrator_service');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const args = {
    userId: new mongoose.Types.ObjectId().toString(),
    question: "Hello, my plant has yellow leaves. What should I do?",
    history: [],
    language: "en"
  };

  console.log("Testing orchestrateChat flow...");
  try {
    const start = Date.now();
    const result = await orchestrateChat(args);
    console.log("Flow completed in " + (Date.now() - start) + "ms");
    console.log("Result Provider:", result.provider);
    console.log("Result Source:", result.source);
    console.log("Result Message Length:", result.message?.length);
    console.log("Snippet:", result.message?.slice(0, 100));
  } catch (err) {
    console.error("Flow failed:", err);
  }
  
  process.exit(0);
}

test();
