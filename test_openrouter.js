const axios = require('axios');

async function testOpenRouter() {
    console.log("=========================================");
    console.log("?? TESTING OPENROUTER API");
    console.log("=========================================\n");

    try {
        console.log("? Ã«—Ì ≈—”«· «·ÿ·» ≈·Ï OpenRouter...");
        
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "qwen/qwen-2.5-72b-instruct",
                messages: [
                    { role: "system", content: "You are an expert agriculture assistant. Reply in Arabic." },
                    { role: "user", content: "ﬂÌ› «⁄«·Ã Õ‘—… «·„‰ ›Ì ‰»«  «·ÿ„«ÿ„ »ÿ—ﬁ ÿ»Ì⁄Ì…ø" }
                ],
                temperature: 0.7,
                max_tokens: 1024
            },
            {
                headers: {
                    "Authorization": "Bearer sk-eOeE6jEVvoMAflPj3V991jgxiBboq6FXLA3lIMpvzihMPj5V",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://nabatech.vercel.app",
                    "X-Title": "Nabatech App"
                }
            }
        );

        console.log("\n? ‰Ã«Õ! «·—œ „‰ OpenRouter:");
        console.log("-----------------------------------------");
        console.log(response.data.choices[0].message.content);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("\n? ›‘· «·« ’«·:");
        console.error(error.response ? error.response.data : error.message);
    }
}

testOpenRouter();
