"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const ai_provider_settings_model_1 = __importDefault(require("./models/ai_provider_settings_model"));
const secret_crypto_1 = require("./services/ai/secret_crypto");
dotenv_1.default.config();
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("=== TEST 1: DATABASE VERIFICATION ===");
    const providers = await ai_provider_settings_model_1.default.find({ providerName: { $in: ["groq", "huggingface"] } });
    const decryptedKeys = {};
    for (const p of providers) {
        console.log(`\nProvider: ${p.providerName}`);
        console.log(`- Enabled: ${p.enabled}`);
        console.log(`- Priority: ${p.priority}`);
        console.log(`- Model: ${p.llmModel}`);
        console.log(`- BaseUrl: ${p.baseUrl}`);
        console.log(`- Status: ${p.status}`);
        console.log(`- Last Error: ${p.lastError || "None"}`);
        const key = (0, secret_crypto_1.decryptSecret)(p.apiKeyEncrypted);
        decryptedKeys[p.providerName] = key;
        console.log(`- apiKeyEncrypted exists: ${!!p.apiKeyEncrypted}`);
        console.log(`- Key is decryptable: ${!!key}`);
        console.log(`- Key is not empty: ${key.length > 0}`);
    }
    console.log("\n=== TEST 2: DIRECT PROVIDER TEST ===");
    for (const p of providers) {
        const key = decryptedKeys[p.providerName];
        if (!key)
            continue;
        console.log(`\nTesting Direct Call to: ${p.providerName}`);
        const start = Date.now();
        try {
            const response = await axios_1.default.post(p.baseUrl, {
                model: p.llmModel,
                messages: [{ role: "user", content: "Hello from Nabatech validation." }]
            }, {
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json"
                }
            });
            const latency = Date.now() - start;
            const data = response.data;
            console.log(`- HTTP Status: ${response.status}`);
            console.log(`- Provider: ${p.providerName}`);
            console.log(`- Model: ${p.llmModel}`);
            console.log(`- Latency: ${latency}ms`);
            console.log(`- Raw Response Snippet: ${JSON.stringify(data).substring(0, 150)}...`);
            console.log(`- Parsed Response: ${data.choices?.[0]?.message?.content}`);
            console.log(`- Tokens Used: ${JSON.stringify(data.usage)}`);
        }
        catch (err) {
            console.log(`- HTTP Status: ${err.response?.status || "Unknown"}`);
            console.log(`- Error: ${err.message}`);
            console.log(`- Raw Error Response: ${JSON.stringify(err.response?.data)}`);
        }
    }
    process.exit(0);
}
run().catch(console.error);
