const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function testVercel() {
    const baseUrl = "https://nabatech-backend.vercel.app/api";
    const email = "test_vercel_rag3@nabatech.com";
    const password = "password123";
    let token = "";

    try {
        console.log("1. Registering...");
        await axios.post(`${baseUrl}/auth/register`, { name: "Test User", email, password });
    } catch (e) {
        if (e.response && e.response.status === 400 && e.response.data.message.includes("exists")) {
            console.log("User already exists, continuing...");
        } else {
            console.error("Register failed:", e.response ? e.response.data : e.message);
        }
    }

    try {
        console.log("2. Logging in...");
        const loginRes = await axios.post(`${baseUrl}/auth/login`, { email, password });
        token = loginRes.data.token || loginRes.data.accessToken;
        console.log("Token acquired.");
    } catch (e) {
        console.error("Login failed:", e.response ? e.response.data : e.message);
        process.exit(1);
    }

    try {
        console.log("3. Sending image to assistant...");
        const imagePath = "C:\\Users\\Ahmed Saeed\\.gemini\\antigravity\\brain\\35648f79-68ff-4dc3-87b0-8d329b07ae20\\media__1781856191815.png";
        const form = new FormData();
        form.append("file", fs.createReadStream(imagePath));
        form.append("question", "What is wrong with my plant?");

        const chatRes = await axios.post(`${baseUrl}/ai/assistant`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        
        console.log("\n--- VERCEL TEST RESULT ---");
        console.dir(chatRes.data, { depth: null });
    } catch (e) {
        console.error("Chat failed:", e.response ? e.response.data : e.message);
        process.exit(1);
    }
}

testVercel();
