const axios = require('axios');
const crypto = require('crypto');

const endpoints = {
  hf_grok: "https://abdulrhmanhelmy-llm-grok.hf.space/query",
  hf_v8: "https://ahmedsaeed111-rag-only.hf.space/ask",
  hf_v62: "https://ahmedsaeed111-agrirag-pro.hf.space/ask"
};

const question = "كيف يمكنني العناية بنبات الطماطم؟";

async function testSpeeds() {
  console.log("🚀 بدء اختبار سرعة نماذج الذكاء الاصطناعي...\n");

  for (const [name, url] of Object.entries(endpoints)) {
    console.log(`⏳ جاري اختبار ${name}...`);
    const start = Date.now();
    let success = false;
    let errMessage = "";
    
    let payload = {};
    if (name === "hf_grok") {
        payload = { question: question, history: [] };
    } else {
        payload = { question: question, history: [] };
    }

    try {
      const response = await axios.post(url, payload, { timeout: 30000 });
      if (response.status === 200) {
        success = true;
      } else {
        errMessage = `Status: ${response.status}`;
      }
    } catch (err) {
      errMessage = err.message;
    }
    
    const timeTaken = Date.now() - start;
    
    if (success) {
      console.log(`✅ ${name}: نجاح! استغرق ${timeTaken} ملي ثانية (ms).`);
    } else {
      console.log(`❌ ${name}: فشل! استغرق ${timeTaken} ملي ثانية (ms). السبب: ${errMessage}`);
    }
    console.log("-----------------------------------------");
  }
}

testSpeeds();
