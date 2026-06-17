"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeErrorMessage = exports.isProviderError = exports.toProviderError = exports.AiProviderError = void 0;
class AiProviderError extends Error {
    constructor(message, options) {
        super(message);
        this.name = "AiProviderError";
        this.code = options?.code || "AI_PROVIDER_ERROR";
        this.isUpstream = options?.isUpstream ?? true;
    }
}
exports.AiProviderError = AiProviderError;
const toProviderError = (error, fallbackMessage, code) => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    return new AiProviderError(message || fallbackMessage, { code, isUpstream: true });
};
exports.toProviderError = toProviderError;
const isProviderError = (error) => {
    return error instanceof AiProviderError;
};
exports.isProviderError = isProviderError;
const sanitizeErrorMessage = (error) => {
    const text = error instanceof Error ? error.message : String(error);
    return text
        .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/gi, "Bearer [REDACTED]")
        .replace(/https?:\/\/\S+/gi, "[URL]")
        .slice(0, 300);
};
exports.sanitizeErrorMessage = sanitizeErrorMessage;
