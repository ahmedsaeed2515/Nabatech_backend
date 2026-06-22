const axios = require('axios');

// === ضع المفتاح الخاص بك هنا ===
const API_KEY = "sk-cBwFVPLvWWSo8EcOGm6FWVOUpsdlQpQ4rGO7dqD6a78ZnHF8";
const BASE_URL = "https://agentrouter.org/v1/chat/completions";

// النماذج التي نريد اختبارها
const models = [
  "deepseek-v4-flash",
  "deepseek-v4-pro",
  "glm-5.1"
];

async function testModels() {
  console.log("🚀 جاري بدء الاختبار على السيرفر المحلي الخاص بك...\n");

  for (const model of models) {
    console.log(`================================================`);
    console.log(`🧪 جاري اختبار النموذج: ${model}`);
    console.log(`================================================`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(BASE_URL, {
        model: model,
        messages: [{ role: "user", content: "مرحبا، هل يمكنك الرد بكلمة واحدة: 'مرحباً'؟" }]
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          // الـ Headers الأساسية التي يتطلبها AgentRouter لتخطي الحظر
          'HTTP-Referer': 'https://agentrouter.org/',
          'X-Title': 'Nabatech'
        },
        timeout: 20000 // 20 seconds
      });
      const timeTaken = Date.now() - startTime;
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        console.log(`✅ نجاح! (استغرق ${timeTaken} ملي ثانية)`);
        console.log(`🤖 رد الذكاء الاصطناعي: ${response.data.choices[0].message.content}\n`);
      } else {
        console.log(`⚠️ رد غير متوقع:`, JSON.stringify(response.data, null, 2), "\n");
      }
    } catch (error) {
      console.log(`❌ فشل الاتصال:`);
      if (error.response) {
        console.log(`   كود الخطأ: ${error.response.status}`);
        console.log(`   تفاصيل الخطأ: ${JSON.stringify(error.response.data, null, 2)}\n`);
      } else {
        console.log(`   السبب: ${error.message}\n`);
      }
    }
  }
}

testModels();
