"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChatText = exports.validateChatHistory = void 0;
var validateChatHistory = function (history) {
    if (!history)
        return true;
    if (!Array.isArray(history))
        return false;
    if (history.length > 20)
        return false;
    for (var _i = 0, history_1 = history; _i < history_1.length; _i++) {
        var msg = history_1[_i];
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
var validateChatText = function (text) {
    if (!text || typeof text !== "string")
        return false;
    var trimmed = text.trim();
    return trimmed.length > 0 && trimmed.length <= 2000;
};
exports.validateChatText = validateChatText;
