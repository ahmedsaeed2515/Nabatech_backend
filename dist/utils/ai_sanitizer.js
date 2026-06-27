"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeModelOutput = void 0;
const sanitizeModelOutput = (text) => {
    if (!text)
        return text;
    // Strip common reasoning block tags and their contents (both closed and unclosed)
    let sanitized = text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
        .replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
        .replace(/<chain_of_thought>[\s\S]*?<\/chain_of_thought>/gi, "")
        .replace(/<thought>[\s\S]*?<\/thought>/gi, "");
    // Strip unclosed tags (model ran out of tokens)
    sanitized = sanitized
        .replace(/<think>[\s\S]*$/gi, "")
        .replace(/<reasoning>[\s\S]*$/gi, "")
        .replace(/<analysis>[\s\S]*$/gi, "")
        .replace(/<chain_of_thought>[\s\S]*$/gi, "")
        .replace(/<thought>[\s\S]*$/gi, "");
    return sanitized.trim();
};
exports.sanitizeModelOutput = sanitizeModelOutput;
