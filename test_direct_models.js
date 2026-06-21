const axios = require('axios');

const API_KEY = "sk-eOeE6jEVvoMAflPj3V991jgxiBboq6FXLA3lIMpvzihMPj5V";
const BASE_URL = "https://agentrouter.org/v1/chat/completions";

const models = [
  "deepseek-v4-flash",
  "deepseek-v4-pro",
  "glm-5.1"
];

async function testModels() {
  for (const model of models) {
    console.log(`\n================================`);
    console.log(`🧪 Testing Model: ${model}`);
    console.log(`================================`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(BASE_URL, {
        model: model,
        messages: [{ role: "user", content: "مرحبا، هل يمكنك إخباري بمعلومة قصيرة عن النباتات؟" }]
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 seconds timeout
      });
      const timeTaken = Date.now() - startTime;
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        console.log(`✅ SUCCESS! (${timeTaken}ms)`);
        console.log(`🤖 Response: ${response.data.choices[0].message.content}`);
      } else {
        console.log(`⚠️ UNEXPECTED RESPONSE:`, JSON.stringify(response.data));
      }
    } catch (error) {
      console.log(`❌ ERROR:`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`   Message: ${error.message}`);
      }
    }
  }
}

testModels();
