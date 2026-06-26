import crypto from "crypto";

const KEY_SOURCE = process.env.AI_SECRETS_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-only-key";
const KEY = crypto.createHash("sha256").update(KEY_SOURCE).digest();

export const encryptSecret = (plain: string): string => {
  const value = plain.trim();
  if (!value) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSecret = (cipherText: string): string => {
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
  } catch {
    return "";
  }
};


