const axios = require('axios');

async function testDeepSeek() {
    try {
        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            { model: "deepseek-chat", messages: [{ role: "user", content: "Hello" }] },
            { headers: { "Authorization": "Bearer sk-eOeE6jEVvoMAflPj3V991jgxiBboq6FXLA3lIMpvzihMPj5V", "Content-Type": "application/json" } }
        );
        console.log("SUCCESS WITH DEEPSEEK!");
    } catch (error) {
        console.log("FAILED WITH DEEPSEEK:", error.response?.data?.error?.message);
    }
}
testDeepSeek();
