"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChatText = exports.validateChatHistory = void 0;
const validateChatHistory = (history) => {
    if (!history)
        return true;
    if (!Array.isArray(history))
        return false;
    if (history.length > 20)
        return false;
    for (const msg of history) {
        if (!msg || typeof msg !== "object")
            return false;
        if (typeof msg.role !== "string" || typeof msg.content !== "string")
            return false;
        if (msg.role !== "user" && msg.role !== "assistant" && msg.role !== "system")
            return false;
        if (!msg.content.trim())
            return false;
    }
    return true;
};
exports.validateChatHistory = validateChatHistory;
const validateChatText = (text) => {
    if (!text || typeof text !== "string")
        return false;
    const trimmed = text.trim();
    return trimmed.length > 0 && trimmed.length <= 2000;
};
exports.validateChatText = validateChatText;
