"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveRagChunks = void 0;
const axios_1 = __importDefault(require("axios"));
const ai_errors_1 = require("./ai_errors");
// ?? Helpers ???????????????????????????????????????????????????????????????????
const formatChunksAsContext = (chunks) => {
    if (!chunks.length)
        return "";
    return chunks
        .map((chunk, i) => `[${i + 1}] [Source: ${chunk.source} | Relevance: ${(chunk.score * 100).toFixed(1)}%]:\n${chunk.text.trim()}`)
        .join("\n\n---\n\n");
};
// ?? Primary export ?????????????????????????????????????????????????????????????
const retrieveRagChunks = async (settings, diseaseName, question, topK) => {
    if (!settings.rag.enabled || !settings.rag.endpointUrl) {
        throw new ai_errors_1.AiProviderError("RAG disabled or not configured", {
            code: "RAG_NOT_CONFIGURED",
            isUpstream: false,
        });
    }
    const ragApiKey = (settings.secrets.ragApiKey || "").trim();
    // FIX [TASK-0.1]: Append ragApiKey to Bearer token — was always empty before
    if (ragApiKey)
        console.log(`[RAG] Auth configured: Bearer ***${ragApiKey.slice(-4)}`);
    const rawEndpoint = process.env.NEW_RAG_URL || settings.rag.endpointUrl;
    const baseUrl = rawEndpoint
        .replace(/\/ask(\/stream)?$/, "")
        .replace(/\/$/, "");
    const retrieveUrl = `${baseUrl}/retrieve`;
    const sanitizedDisease = diseaseName.trim().substring(0, 200);
    const skipPhrases = ["please analyze", "analyze this", "analyze my", "please check"];
    const lowerQ = (question || "").toLowerCase();
    const usefulQuestion = question && !skipPhrases.some((p) => lowerQ.includes(p))
        ? question.substring(0, 500)
        : "";
    let response;
    try {
        response = await axios_1.default.post(retrieveUrl, {
            disease_name: sanitizedDisease,
            question: usefulQuestion,
            top_k: topK || settings.rag.topK || 8,
        }, {
            timeout: settings.rag.timeoutMs,
            headers: ragApiKey ? { Authorization: `Bearer ${ragApiKey}` } : undefined,
        });
    }
    catch (error) {
        throw (0, ai_errors_1.toProviderError)(error, "RAG /retrieve request failed for disease: ", "RAG_UPSTREAM_FAILED");
    }
    const data = (response.data || {});
    const rawChunks = Array.isArray(data.chunks) ? data.chunks : [];
    if (!rawChunks.length) {
        throw new ai_errors_1.AiProviderError("RAG returned no chunks for disease: ", { code: "RAG_EMPTY_RESPONSE" });
    }
    const chunks = rawChunks
        .filter((c) => c && typeof c.text === "string" && c.text.trim().length > 10)
        .map((c) => ({
        text: String(c.text).trim(),
        source: String(c.source || "Unknown").trim(),
        score: typeof c.score === "number" ? Math.max(0, Math.min(1, c.score)) : 0,
    }));
    if (!chunks.length) {
        throw new ai_errors_1.AiProviderError("RAG chunks were all empty or malformed", {
            code: "RAG_INVALID_RESPONSE",
        });
    }
    const contextText = formatChunksAsContext(chunks);
    console.log(`[RAG_RETRIEVE_SUCCESS] disease="${sanitizedDisease}" | chunks=${chunks.length}`);
    return {
        contextText,
        chunks,
        totalFound: data.total_found || chunks.length,
        source: "rag",
        provider: "rag",
    };
};
exports.retrieveRagChunks = retrieveRagChunks;
