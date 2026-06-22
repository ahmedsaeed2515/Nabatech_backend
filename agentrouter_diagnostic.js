const axios = require('axios');
const fs = require('fs');

const API_KEY = "sk-cBwFVPLvWWSo8EcOGm6FWVOUpsdlQpQ4rGO7dqD6a78ZnHF8";
const BASE_URL = "https://agentrouter.org/v1/chat/completions";

const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://agentrouter.org/',
  'X-Title': 'Nabatech'
};

const tests = [
  {
    name: "Test A: Simple Hello (deepseek-v4-flash)",
    model: "deepseek-v4-flash",
    messages: [{ role: "user", content: "Hello" }]
  },
  {
    name: "Test B: Tomato Plant (deepseek-v4-flash)",
    model: "deepseek-v4-flash",
    messages: [{ role: "user", content: "What is a tomato plant?" }]
  },
  {
    name: "Test C: Production Prompt (deepseek-v4-flash)",
    model: "deepseek-v4-flash",
    messages: [
      { role: "system", content: "You are an agricultural expert." },
      { role: "user", content: "My tomato plant has yellow leaves. What is wrong?" }
    ]
  },
  {
    name: "Test D: Standard OpenRouter Model (openai/gpt-4o-mini)",
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Hello" }]
  },
  {
    name: "Test E: Standard DeepSeek Model (deepseek-chat)",
    model: "deepseek-chat",
    messages: [{ role: "user", content: "Hello" }]
  },
  {
    name: "Test F: Invalid Model Name Test",
    model: "fake-model-xyz-123",
    messages: [{ role: "user", content: "Hello" }]
  }
];

async function runDiagnostics() {
  console.log("🚀 Starting AgentRouter Diagnostics...");
  const results = [];

  // Fetch models list first
  console.log("\n▶️ Test G: Fetching /v1/models...");
  try {
    const modelsRes = await axios.get("https://agentrouter.org/v1/models", { headers: HEADERS });
    console.log("✅ Models list fetched successfully.");
    results.push({
      test: "Test G: Fetch Models",
      status: modelsRes.status,
      models_count: modelsRes.data?.data?.length || 0,
      sample_models: modelsRes.data?.data?.slice(0, 5).map(m => m.id)
    });
  } catch (err) {
    console.log(`❌ Failed: ${err.response ? err.response.status : err.message}`);
    results.push({
      test: "Test G: Fetch Models",
      error_status: err.response?.status,
      error_data: err.response?.data
    });
  }

  for (const test of tests) {
    console.log(`\n▶️ Running ${test.name}...`);
    try {
      const payload = {
        model: test.model,
        messages: test.messages
      };
      
      const response = await axios.post(BASE_URL, payload, { headers: HEADERS, timeout: 20000 });
      console.log(`✅ Success!`);
      results.push({
        test: test.name,
        payload,
        status: response.status,
        response: response.data
      });
    } catch (error) {
      console.log(`❌ Failed: ${error.response ? error.response.status : error.message}`);
      results.push({
        test: test.name,
        payload: { model: test.model, messages: test.messages },
        error_status: error.response?.status,
        error_data: error.response?.data,
        error_message: error.message
      });
    }
  }

  fs.writeFileSync('agentrouter_diagnostic_results.json', JSON.stringify(results, null, 2));
  console.log("\n✅ Diagnostics complete. Results saved to 'agentrouter_diagnostic_results.json'.");
}

runDiagnostics();
