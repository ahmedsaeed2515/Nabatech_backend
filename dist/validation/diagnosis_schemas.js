"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTopK = exports.validateQuestion = exports.validateHistory = void 0;
const validateHistory = (history) => {
    if (!history)
        return true;
    if (!Array.isArray(history))
        return false;
    if (history.length > 12)
        return false;
    for (const msg of history) {
        if (!msg || typeof msg !== "object")
            return false;
        if (typeof msg.role !== "string" || typeof msg.content !== "string")
            return false;
    }
    return true;
};
exports.validateHistory = validateHistory;
const validateQuestion = (question) => {
    if (!question)
        return true;
    return question.length <= 2000;
};
exports.validateQuestion = validateQuestion;
const validateTopK = (topK) => {
    if (topK === undefined)
        return true;
    return Number.isInteger(topK) && topK >= 1 && topK <= 20;
};
exports.validateTopK = validateTopK;
