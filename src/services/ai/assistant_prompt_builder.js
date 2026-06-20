"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAssistantPrompt = exports.extractRagQuery = void 0;
var formatCandidates = function (candidates) {
    if (candidates === void 0) { candidates = []; }
    if (!candidates.length)
        return "none";
    return candidates
        .slice(0, 5)
        .map(function (c) { return "".concat(c.label).concat(typeof c.confidence === "number" ? " (".concat((c.confidence * 100).toFixed(1), "%)") : ""); })
        .join(", ");
};
/**
 * Extracts a CLEAN user question for RAG retrieval.
 * RAG must receive ONLY the user's original question — no system prompts,
 * no CNN metadata, no preambles. This prevents RAG hallucination caused
 * by dirty retrieval queries.
 */
var extractRagQuery = function (userQuestion) {
    var q = (userQuestion || "").trim();
    if (!q || q.length < 3) {
        return "plant disease diagnosis and treatment";
    }
    // Truncate to 500 chars max for RAG embedding safety
    return q.substring(0, 500);
};
exports.extractRagQuery = extractRagQuery;
/**
 * Builds the full enriched LLM prompt AFTER RAG retrieval.
 * This is injected as the user message body into the LLM call,
 * combined with conversation history as separate chat turns.
 *
 * Do NOT use this output as the RAG query — use extractRagQuery() for that.
 */
var buildAssistantPrompt = function (ctx) {
    var _a, _b, _c;
    // NOTE: Do NOT add a system prompt here.
    // The LLM provider already receives settings.llm.systemPrompt as the system turn.
    // This function builds only the USER message body: CNN context + RAG context + question.
    return [
        "User question: ".concat(ctx.userQuestion || "No explicit question provided."),
        ((_a = ctx.cnn) === null || _a === void 0 ? void 0 : _a.prediction)
            ? "CNN prediction: ".concat(ctx.cnn.prediction, " (confidence: ").concat(typeof ctx.cnn.confidence === "number" ? ctx.cnn.confidence.toFixed(3) : "unknown", ")")
            : "",
        ((_c = (_b = ctx.cnn) === null || _b === void 0 ? void 0 : _b.candidates) === null || _c === void 0 ? void 0 : _c.length)
            ? "CNN candidates: ".concat(formatCandidates(ctx.cnn.candidates))
            : "",
        ctx.kbAdvice ? "Standard Offline Advice: ".concat(ctx.kbAdvice) : "",
        ctx.kbSeverity ? "Expected Severity: ".concat(ctx.kbSeverity) : "",
        ctx.lowConfidenceWarning ? "Warning: ".concat(ctx.lowConfidenceWarning) : "",
        ctx.ragContext ? "\nRetrieved Knowledge Context:\n".concat(ctx.ragContext) : "",
        ctx.communityContext ? "\nRetrieved Community Context:\n".concat(ctx.communityContext) : "",
        ctx.language ? "\n[CRITICAL INSTRUCTION]: You MUST respond entirely in the following language code: ".concat(ctx.language.toUpperCase()) : "",
    ]
        .filter(Boolean)
        .join("\n");
};
exports.buildAssistantPrompt = buildAssistantPrompt;
