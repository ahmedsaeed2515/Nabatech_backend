const axios = require('axios');

async function testAgentRouter() {
    console.log("=========================================");
    console.log("?? TESTING AGENTROUTER API");
    console.log("=========================================\n");

    try {
        console.log("? Ã«—Ì ≈—”«· «·ÿ·» ≈·Ï AgentRouter...");
        
        const response = await axios.post(
            "https://agentrouter.org/v1/chat/completions",
            {
                model: "claude-3-haiku-20240307", // Trying a common model
                messages: [
                    { role: "system", content: "You are an expert agriculture assistant. Reply in Arabic." },
                    { role: "user", content: "„—Õ»«" }
                ]
            },
            {
                headers: {
                    "Authorization": "Bearer sk-eOeE6jEVvoMAflPj3V991jgxiBboq6FXLA3lIMpvzihMPj5V",
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("\n? ‰Ã«Õ! «·—œ:");
        console.log("-----------------------------------------");
        console.log(response.data.choices[0].message.content);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("\n? ›‘· «·« ’«·:");
        console.error(error.response ? error.response.data : error.message);
    }
}

testAgentRouter();
