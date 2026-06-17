"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptSecret = exports.encryptSecret = void 0;
const crypto_1 = __importDefault(require("crypto"));
const KEY_SOURCE = process.env.AI_SECRETS_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-only-key";
const KEY = crypto_1.default.createHash("sha256").update(KEY_SOURCE).digest();
const encryptSecret = (plain) => {
    const value = plain.trim();
    if (!value)
        return "";
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", KEY, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};
exports.encryptSecret = encryptSecret;
const decryptSecret = (cipherText) => {
    const value = (cipherText || "").trim();
    if (!value)
        return "";
    const [ivHex, payloadHex] = value.split(":");
    if (!ivHex || !payloadHex)
        return "";
    try {
        const iv = Buffer.from(ivHex, "hex");
        const payload = Buffer.from(payloadHex, "hex");
        const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", KEY, iv);
        const out = Buffer.concat([decipher.update(payload), decipher.final()]);
        return out.toString("utf8");
    }
    catch {
        return "";
    }
};
exports.decryptSecret = decryptSecret;
