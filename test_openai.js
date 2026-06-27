const axios = require('axios');

async function testOpenAI() {
    console.log("🚀 جاري اختبار rag_openai (OpenAI API)...");
    const startTime = Date.now();
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "كيف يمكنني العناية بنبات الطماطم؟ أجب باختصار شديد." }],
                max_tokens: 50
            },
            {
                headers: {
                    "Authorization": "Bearer sk-eOeE6jEVvoMAflPj3V991jgxiBboq6FXLA3lIMpvzihMPj5V", // The key from test_openai.js
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );
        const timeTaken = Date.now() - startTime;
        console.log(`✅ النجاح! rag_openai شغال.`);
        console.log(`⏱️ الوقت المستغرق: ${timeTaken} ملي ثانية (ms).`);
        console.log(`🤖 الرد: ${response.data.choices[0].message.content}`);
    } catch (error) {
        const timeTaken = Date.now() - startTime;
        console.log(`❌ فشل! الوقت المستغرق: ${timeTaken} ملي ثانية (ms).`);
        console.log("السبب:", error.response?.data?.error?.message || error.message);
    }
}

testOpenAI();
