import { askHuggingFaceIntegrated } from "../services/ai/hf_integrated_provider";

async function runTests() {
  console.log("=== Testing All AI Modes Individually ===\n");

  const question = "ما هي أعراض اللفحة المبكرة في الطماطم؟";
  console.log(`Question: "${question}"\n`);

  const modes = [
    { id: "hf_grok", url: "https://abdulrhmanhelmy-llm-grok.hf.space/query" },
    { id: "hf_v8", url: "https://ahmedsaeed111-rag-only.hf.space/ask" },
    { id: "hf_v62", url: "https://ahmedsaeed111-agrirag-pro.hf.space/ask" }
  ];

  for (const m of modes) {
    console.log(`[TESTING] Mode: ${m.id}`);
    console.log(`Endpoint: ${m.url}`);
    
    try {
      const start = Date.now();
      const res = await askHuggingFaceIntegrated(m.id as any, m.url, question, [], 60000);
      const ms = Date.now() - start;
      
      if (res.success) {
        console.log(`✅ SUCCESS (${res.latencyMs}ms)`);
        console.log(`Response Snippet: ${res.answer.slice(0, 150).replace(/\n/g, " ")}...`);
      } else {
        console.log(`❌ FAILED (${ms}ms)`);
        console.log(`Error: ${res.error}`);
      }
    } catch (e: any) {
      console.log(`❌ CRASHED: ${e.message}`);
    }
    console.log("--------------------------------------------------\n");
  }
}

runTests().then(() => {
  console.log("Tests complete.");
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});


