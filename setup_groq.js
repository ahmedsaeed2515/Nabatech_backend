require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const KEY_SOURCE = process.env.AI_SECRETS_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-only-key";
const KEY = crypto.createHash("sha256").update(KEY_SOURCE).digest();

function encryptSecret(plain) {
  const value = plain.trim();
  if (!value) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

async function setupGroq() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const apiKey = process.env.GROQ_API_KEY;
  const encryptedKey = encryptSecret(apiKey);

  const groqProvider = {
    providerName: "groq",
    enabled: true,
    priority: 1, 
    defaultProvider: true,
    apiKeyEncrypted: encryptedKey,
    llmModel: "qwen/qwen3-32b", 
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    status: "healthy",
    lastHealthCheck: new Date(),
    lastError: ""
  };

  await mongoose.connection.collection('aiprovidersettings').updateOne(
    { providerName: "groq" },
    { $set: groqProvider },
    { upsert: true }
  );
  console.log("Configured groq");

  await mongoose.connection.collection('aiprovidersettings').updateMany(
    { providerName: { $in: ['agentrouter-flash', 'agentrouter-pro', 'agentrouter-glm', 'openrouter', 'gemini'] } },
    { $set: { priority: 99, enabled: false } }
  );

  console.log("Done");
  process.exit();
}

setupGroq().catch(console.error);
