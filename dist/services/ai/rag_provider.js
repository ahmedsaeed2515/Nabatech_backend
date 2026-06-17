"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askRag = void 0;
const axios_1 = __importDefault(require("axios"));
const ai_errors_1 = require("./ai_errors");
const askRag = async (settings, question, history, topK) => {
    if (!settings.rag.enabled || !settings.rag.endpointUrl) {
        throw new ai_errors_1.AiProviderError("RAG disabled or not configured", {
            code: "RAG_NOT_CONFIGURED",
            isUpstream: false,
        });
    }
    let response;
    try {
        const ragApiKey = (settings.secrets.ragApiKey || "").trim();
        // Context Assembly bounds token limits
        const maxHistoryItems = 5;
        const boundedHistory = history.slice(-maxHistoryItems);
        const boundedQuestion = question.substring(0, 1000); // Max 1000 chars
        response = await axios_1.default.post(settings.rag.endpointUrl, {
            question: boundedQuestion,
            history: boundedHistory,
            top_k: topK || settings.rag.topK,
        }, {
            timeout: settings.rag.timeoutMs,
            headers: ragApiKey ? { Authorization: `Bearer ${ragApiKey}` } : undefined,
        });
    }
    catch (error) {
        throw (0, ai_errors_1.toProviderError)(error, "RAG provider request failed", "RAG_UPSTREAM_FAILED");
    }
    const data = (response.data || {});
    const message = (data.answer || data.response || data.result || data.message || "").toString().trim();
    if (!message) {
        throw new ai_errors_1.AiProviderError("Empty response from RAG provider", {
            code: "RAG_EMPTY_RESPONSE",
        });
    }
    return { message, source: "rag", provider: "rag" };
};
exports.askRag = askRag;
