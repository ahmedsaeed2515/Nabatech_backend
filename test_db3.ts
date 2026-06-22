import mongoose from "mongoose";
import AiProviderSettings from "./src/models/ai_provider_settings_model";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const KEY_SOURCE = process.env.AI_SECRETS_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-only-key";
console.log("KEY_SOURCE:", KEY_SOURCE);
const KEY = crypto.createHash("sha256").update(KEY_SOURCE).digest();

const decryptSecret = (cipherText: string): string => {
  const value = (cipherText || "").trim();
  if (!value) return "";
  const [ivHex, payloadHex] = value.split(":");
  if (!ivHex || !payloadHex) return "";
  try {
    const iv = Buffer.from(ivHex, "hex");
    const payload = Buffer.from(payloadHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    const out = Buffer.concat([decipher.update(payload), decipher.final()]);
    return out.toString("utf8");
  } catch(e) {
    console.error("DECRYPT ERR:", e);
    return "";
  }
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const providers = await AiProviderSettings.find({});
  for (const p of providers) {
    let dec = "err";
    try {
      dec = p.apiKeyEncrypted ? decryptSecret(p.apiKeyEncrypted).substring(0, 15) : "none";
    } catch(e) {}
    console.log(p.providerName, "- decrypted:", dec, "- model:", p.llmModel);
  }
  process.exit(0);
}
run();
