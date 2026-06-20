const axios = require('axios');

async function testOpenAI() {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Hello" }],
                max_tokens: 10
            },
            {
                headers: {
                    "Authorization": "Bearer sk-eOeE6jEVvoMAflPj3V991jgxiBboq6FXLA3lIMpvzihMPj5V",
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("SUCCESS WITH OPENAI!");
    } catch (error) {
        console.log("FAILED WITH OPENAI:", error.response?.data?.error?.message);
    }
}

testOpenAI();
