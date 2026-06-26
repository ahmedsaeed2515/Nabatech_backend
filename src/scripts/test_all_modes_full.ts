import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { askHuggingFaceIntegrated } from "../services/ai/hf_integrated_provider";
import { retrieveRagChunks } from "../services/ai/rag_provider";
import { askLlm } from "../services/ai/llm_provider";
import { getAiSettings } from "../services/ai/ai_config_service";
import { buildAssistantPrompt } from "../services/ai/assistant_prompt_builder";

async function runTests() {
  console.log("=== FULL SYSTEM TEST: ALL 4 AI MODES ===\n");

  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech";
  await mongoose.connect(MONGO_URI);
  console.log("[DB] Connected to MongoDB.");

  const settings = await getAiSettings();
  const question = "أنا عندي بقع سوداء صغيرة على أوراق الطماطم السفلية، وبتكبر على شكل دوائر. إيه هو المرض وكيف أعالجه؟";
  
  console.log(`\nQUESTION: "${question}"\n`);

  // 1. rag_openai (Native DB + OpenAI)
  console.log("--------------------------------------------------");
  console.log("[TEST 1] Mode: RAG + OpenAI (rag_openai)");
  try {
    const start = Date.now();
    
    // Simulate what the orchestrator does for text chat
    // Actually, orchestrateChat just passes it to rag_provider and then llm_provider
    // Let's do a search LLM step (optional) then retrieve
    const ragResult = await retrieveRagChunks(settings, "Tomato_Early_Blight", question, 5, "ar");
    
    const prompt = buildAssistantPrompt({
      userQuestion: question,
      history: [],
      ragContext: ragResult.contextText,
      language: "ar",
    });

    const llmResult = await askLlm(settings, prompt, "llm", [], "chat");
    const ms = Date.now() - start;

    console.log(`✅ SUCCESS (${ms}ms)`);
    console.log(`Sources found: ${ragResult.totalFound}`);
    console.log(`Response Snippet: ${llmResult.message.slice(0, 200).replace(/\n/g, " ")}...`);
  } catch (e: any) {
    console.log(`❌ FAILED: ${e.message}`);
  }

  // HF Modes Setup
  const hfModes = [
    { id: "hf_v8", name: "AgriRAG Pro v8.0", url: settings.hfIntegrated.v8EndpointUrl },
    { id: "hf_v62", name: "AgriRAG Pro v6.2", url: settings.hfIntegrated.v62EndpointUrl },
    { id: "hf_grok", name: "Grok LLM", url: settings.hfIntegrated.grokEndpointUrl },
  ];

  let testNum = 2;
  for (const m of hfModes) {
    console.log("--------------------------------------------------");
    console.log(`[TEST ${testNum++}] Mode: ${m.name} (${m.id})`);
    console.log(`Endpoint: ${m.url}`);
    
    try {
      const start = Date.now();
      const res = await askHuggingFaceIntegrated(m.id as any, m.url, question, [], 60000);
      const ms = Date.now() - start;
      
      if (res.success) {
        console.log(`✅ SUCCESS (${ms}ms)`);
        console.log(`Response Snippet: ${res.answer.slice(0, 200).replace(/\n/g, " ")}...`);
      } else {
        console.log(`❌ FAILED (${ms}ms)`);
        console.log(`Error: ${res.error}`);
      }
    } catch (e: any) {
      console.log(`❌ CRASHED: ${e.message}`);
    }
  }

  console.log("--------------------------------------------------\n");
  console.log("Tests complete.");
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});


