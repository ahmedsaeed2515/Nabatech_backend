"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTopK = exports.validateQuestion = exports.validateHistory = void 0;
var validateHistory = function (history) {
    if (!history)
        return true;
    if (!Array.isArray(history))
        return false;
    if (history.length > 12)
        return false;
    for (var _i = 0, history_1 = history; _i < history_1.length; _i++) {
        var msg = history_1[_i];
        if (!msg || typeof msg !== "object")
            return false;
        if (typeof msg.role !== "string" || typeof msg.content !== "string")
            return false;
    }
    return true;
};
exports.validateHistory = validateHistory;
var validateQuestion = function (question) {
    if (!question)
        return true;
    return question.length <= 2000;
};
exports.validateQuestion = validateQuestion;
var validateTopK = function (topK) {
    if (topK === undefined)
        return true;
    return Number.isInteger(topK) && topK >= 1 && topK <= 20;
};
exports.validateTopK = validateTopK;
