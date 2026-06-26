const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function testVercel() {
    const baseUrl = "https://nabatech-backend.vercel.app/api";
    const email = `test_vercel_${Date.now()}@nabatech.com`;
    const password = "password123";
    let token = "";

    try {
        console.log("1. Registering...");
        await axios.post(`${baseUrl}/auth/register`, { name: "Test User", email, password });
        console.log("   -> Registered OK");
    } catch (e) {
        if (e.response && e.response.status === 400 && e.response.data.message?.includes("exists")) {
            console.log("   -> User already exists, continuing...");
        } else {
            console.error("   -> Register failed:", e.response ? e.response.data : e.message);
        }
    }

    try {
        console.log("2. Logging in...");
        const loginRes = await axios.post(`${baseUrl}/auth/login`, { email, password });
        token = loginRes.data.token || loginRes.data.accessToken;
        console.log("   -> Token acquired.");
    } catch (e) {
        console.error("   -> Login failed:", e.response ? e.response.data : e.message);
        process.exit(1);
    }

    // ─── Test 1: Text Chat ────────────────────────────────────────────────────
    try {
        console.log("\n3. [TEXT CHAT] Sending Arabic question...");
        const t0 = Date.now();
        const chatRes = await axios.post(`${baseUrl}/ai/assistant`, {
            question: "ما هي أسباب اصفرار أوراق الطماطم؟"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const elapsed = Date.now() - t0;
        console.log(`   -> Response time: ${elapsed}ms`);
        console.log(`   -> Provider: ${chatRes.data.provider}`);
        console.log(`   -> Message (first 300 chars): ${(chatRes.data.message || "").substring(0, 300)}`);
        if (elapsed > 20000) console.warn("   -> SLOW: >20s!");
        else if (elapsed > 8000) console.warn("   -> Moderate: >8s");
        else console.log("   -> FAST response!");
    } catch (e) {
        console.error("   -> Chat failed:", e.response ? e.response.data : e.message);
    }

    // ─── Test 2: Image Diagnosis ──────────────────────────────────────────────
    if (fs.existsSync("./tomato.jpg")) {
        try {
            console.log("\n4. [IMAGE DIAGNOSIS] Sending tomato.jpg...");
            const t0 = Date.now();
            const form = new FormData();
            form.append("file", fs.createReadStream("./tomato.jpg"));
            form.append("question", "ما مرض هذا النبات؟");
            const imgRes = await axios.post(`${baseUrl}/ai/assistant`, form, {
                headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
            });
            const elapsed = Date.now() - t0;
            console.log(`   -> Response time: ${elapsed}ms`);
            console.log(`   -> Mode: ${imgRes.data.mode} | Provider: ${imgRes.data.provider}`);
            if (imgRes.data.diagnosis) {
                console.log(`   -> CNN: ${imgRes.data.diagnosis.prediction} (${(imgRes.data.diagnosis.confidence * 100).toFixed(1)}%)`);
            }
            if (imgRes.data.lowConfidenceWarning) console.warn(`   -> Low confidence: ${imgRes.data.lowConfidenceWarning}`);
            console.log(`   -> Message (first 300 chars): ${(imgRes.data.message || "").substring(0, 300)}`);
        } catch (e) {
            console.error("   -> Image diagnosis failed:", e.response ? e.response.data : e.message);
        }
    }

    console.log("\n=== Tests Done ===");
}

testVercel();
