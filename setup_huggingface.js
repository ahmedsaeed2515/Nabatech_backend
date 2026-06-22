const mongoose = require("mongoose");
require("dotenv").config();
const crypto = require("crypto");

// Minimal crypto implementation duplicating what's in secret_crypto.ts for the script
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; // 32 chars
const ALGORITHM = "aes-256-cbc";

function encryptSecret(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

const aiProviderSchema = new mongoose.Schema({
  providerName: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  priority: { type: Number, required: true, default: 99 },
  defaultProvider: { type: Boolean, default: false },
  apiKeyEncrypted: { type: String, default: "" },
  llmModel: { type: String, required: true },
  baseUrl: { type: String, required: true },
  status: { type: String, enum: ["healthy", "degraded", "failed", "unknown"], default: "unknown" },
  lastHealthCheck: { type: Date },
  lastError: { type: String, default: "" }
}, { timestamps: true });

const AiProviderSettings = mongoose.models.AiProviderSettings || mongoose.model("AiProviderSettings", aiProviderSchema);

async function setup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const HF_TOKEN = process.env.HF_TOKEN;
    const encryptedKey = encryptSecret(HF_TOKEN);

    await AiProviderSettings.findOneAndUpdate(
      { providerName: "huggingface" },
      {
        enabled: true,
        priority: 4,
        defaultProvider: false,
        apiKeyEncrypted: encryptedKey,
        llmModel: "Qwen/Qwen3-32B",
        baseUrl: "https://router.huggingface.co/v1/chat/completions",
        status: "healthy"
      },
      { upsert: true, new: true }
    );

    console.log("Successfully provisioned HuggingFace Router in MongoDB");
  } catch (err) {
    console.error("Failed to provision DB:", err);
  } finally {
    await mongoose.disconnect();
  }
}

setup();
