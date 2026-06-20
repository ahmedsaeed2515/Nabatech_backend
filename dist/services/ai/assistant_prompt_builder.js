"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAssistantPrompt = exports.extractRagQuery = void 0;
const formatCandidates = (candidates = []) => {
    if (!candidates.length)
        return "none";
    return candidates
        .slice(0, 5)
        .map((c) => `${c.label}${typeof c.confidence === "number" ? ` (${(c.confidence * 100).toFixed(1)}%)` : ""}`)
        .join(", ");
};
/**
 * Extracts a CLEAN user question for RAG retrieval.
 * RAG must receive ONLY the user's original question — no system prompts,
 * no CNN metadata, no preambles. This prevents RAG hallucination caused
 * by dirty retrieval queries.
 */
const extractRagQuery = (userQuestion) => {
    const q = (userQuestion || "").trim();
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
const buildAssistantPrompt = (ctx) => {
    // NOTE: Do NOT add a system prompt here.
    // The LLM provider already receives settings.llm.systemPrompt as the system turn.
    // This function builds only the USER message body: CNN context + RAG context + question.
    return [
        `User question: ${ctx.userQuestion || "No explicit question provided."}`,
        ctx.cnn?.prediction
            ? `CNN prediction: ${ctx.cnn.prediction} (confidence: ${typeof ctx.cnn.confidence === "number" ? ctx.cnn.confidence.toFixed(3) : "unknown"})`
            : "",
        ctx.cnn?.candidates?.length
            ? `CNN candidates: ${formatCandidates(ctx.cnn.candidates)}`
            : "",
        ctx.kbAdvice ? `Standard Offline Advice: ${ctx.kbAdvice}` : "",
        ctx.kbSeverity ? `Expected Severity: ${ctx.kbSeverity}` : "",
        ctx.lowConfidenceWarning ? `Warning: ${ctx.lowConfidenceWarning}` : "",
        ctx.ragContext ? `\nRetrieved Knowledge Context:\n${ctx.ragContext}` : "",
        ctx.communityContext ? `\nRetrieved Community Context:\n${ctx.communityContext}` : "",
        ctx.language ? `\n[CRITICAL INSTRUCTION]: You MUST respond entirely in the following language code: ${ctx.language.toUpperCase()}` : "",
    ]
        .filter(Boolean)
        .join("\n");
};
exports.buildAssistantPrompt = buildAssistantPrompt;
