const axios = require('axios');

async function testGroq() {
    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            { model: "llama3-8b-8192", messages: [{ role: "user", content: "Hello" }] },
            { headers: { "Authorization": "Bearer sk-eOeE6jEVvoMAflPj3V991jgxiBboq6FXLA3lIMpvzihMPj5V", "Content-Type": "application/json" } }
        );
        console.log("SUCCESS WITH GROQ!");
    } catch (error) {
        console.log("FAILED WITH GROQ:", error.response?.data?.error?.message);
    }
}
testGroq();
