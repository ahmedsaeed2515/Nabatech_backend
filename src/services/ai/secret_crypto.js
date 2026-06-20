"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptSecret = exports.encryptSecret = void 0;
var crypto_1 = __importDefault(require("crypto"));
var KEY_SOURCE = process.env.AI_SECRETS_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-only-key";
var KEY = crypto_1.default.createHash("sha256").update(KEY_SOURCE).digest();
var encryptSecret = function (plain) {
    var value = plain.trim();
    if (!value)
        return "";
    var iv = crypto_1.default.randomBytes(16);
    var cipher = crypto_1.default.createCipheriv("aes-256-cbc", KEY, iv);
    var encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return "".concat(iv.toString("hex"), ":").concat(encrypted.toString("hex"));
};
exports.encryptSecret = encryptSecret;
var decryptSecret = function (cipherText) {
    var value = (cipherText || "").trim();
    if (!value)
        return "";
    var _a = value.split(":"), ivHex = _a[0], payloadHex = _a[1];
    if (!ivHex || !payloadHex)
        return "";
    try {
        var iv = Buffer.from(ivHex, "hex");
        var payload = Buffer.from(payloadHex, "hex");
        var decipher = crypto_1.default.createDecipheriv("aes-256-cbc", KEY, iv);
        var out = Buffer.concat([decipher.update(payload), decipher.final()]);
        return out.toString("utf8");
    }
    catch (_b) {
        return "";
    }
};
exports.decryptSecret = decryptSecret;
