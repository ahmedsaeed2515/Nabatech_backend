const mongoose = require('mongoose');
const { getAiSettings } = require('./src/services/ai/ai_config_service');
const { orchestrateAssistantRequest } = require('./src/services/ai/ai_orchestrator_service');

async function run() {
  await mongoose.connect('mongodb+srv://nabatechuser:oMv9Lz7YI8aZOTaG@cluster0.jpiebma.mongodb.net/nabatech?retryWrites=true&w=majority&appName=Cluster0');
  const settings = await getAiSettings();

  console.log('--- Testing text chat with INVALID LLM KEY to trigger HF-RAG fallback ---');
  
  // Monkey patch settings to break LLM pool
  settings.llm.pool = [{
    name: "openai-broken",
    enabled: true,
    providerType: "generic_llm",
    endpointUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    apiKey: "sk-broken123"
  }];
  
  try {
    const res = await orchestrateAssistantRequest({
      question: "ﬂÌ› «⁄«·Ã Õ‘—… «·„‰ ›Ì ‰»«  «·ÿ„«ÿ„ø",
      history: [],
      topK: 2
    });
    console.log('Result Source:', res.source);
    console.log('Result Provider:', res.provider);
    console.log('Result Message:\\n' + res.message);
  } catch (e) {
    console.error('Error:', e);
  }

  process.exit(0);
}
run();
