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
const LANGUAGE_MAP = {
    ar: "Arabic",
    en: "English",
    fr: "French",
    es: "Spanish",
    ur: "Urdu"
};
/**
 * Builds the full enriched LLM prompt AFTER RAG retrieval.
 * This is injected as the user message body into the LLM call,
 * combined with conversation history as separate chat turns.
 *
 * Do NOT use this output as the RAG query — use extractRagQuery() for that.
 */
const buildAssistantPrompt = (ctx) => {
    const languageName = ctx.language ? (LANGUAGE_MAP[ctx.language.toLowerCase()] || ctx.language) : "English";
    let diagnosisFormatInstruction = "";
    if (ctx.cnn?.prediction) {
        const isHealthy = ctx.cnn.prediction.toLowerCase().includes("healthy");
        if (isHealthy) {
            diagnosisFormatInstruction = `\n[FORMAT REQUIREMENT]
Since the user uploaded an image for diagnosis and the CNN predicted healthy, you MUST structure your response with the following sections.
CRITICAL: You MUST translate the section titles and all content into the SAME LANGUAGE as the user's question. For example, if the user asks in Arabic, use Arabic titles like (المرض:, نسبة الثقة:, الوصف:, العلاج:, الوقاية:).

[Translated 'Disease']: ${ctx.cnn.prediction.replace(/_/g, " ")}
[Translated 'Confidence']: [Confidence %]
[Translated 'Description']: [Short assessment that the plant appears healthy]
[Translated 'Treatment']: None required.
[Translated 'Prevention']: Maintain current healthy care routines.

Do NOT provide specific disease treatments or hallucinate diseases.`;
        }
        else {
            diagnosisFormatInstruction = `\n[FORMAT REQUIREMENT]
Since the user uploaded an image for diagnosis, you MUST structure your response with the following sections.
CRITICAL: You MUST translate the section titles and all content into the SAME LANGUAGE as the user's question. For example, if the user asks in Arabic, use Arabic titles like (المرض:, نسبة الثقة:, الوصف:, العلاج:, الوقاية:).

[Translated 'Disease']: [Clean Disease Name, e.g. Apple Scab]
[Translated 'Confidence']: [Confidence %]
[Translated 'Description']: [Short description]
[Translated 'Treatment']:
• [Step 1]
• [Step 2]
[Translated 'Prevention']:
• [Step 1]
• [Step 2]

Do NOT use underscores in disease names (use "Apple Scab", not "Apple_Scab").`;
        }
    }
    // NOTE: Do NOT add a system prompt here.
    // The LLM provider already receives settings.llm.systemPrompt as the system turn.
    // This function builds only the USER message body: CNN context + RAG context + question.
    return [
        `User question: ${ctx.userQuestion || "No explicit question provided."}`,
        ctx.cnn?.prediction
            ? `CNN prediction: ${ctx.cnn.prediction.replace(/_/g, " ")} (confidence: ${typeof ctx.cnn.confidence === "number" ? ctx.cnn.confidence.toFixed(3) : "unknown"})`
            : "",
        ctx.cnn?.candidates?.length
            ? `CNN candidates: ${formatCandidates(ctx.cnn.candidates).replace(/_/g, " ")}`
            : "",
        ctx.kbAdvice ? `Standard Offline Advice: ${ctx.kbAdvice}` : "",
        ctx.kbSeverity ? `Expected Severity: ${ctx.kbSeverity}` : "",
        ctx.lowConfidenceWarning ? `Warning: ${ctx.lowConfidenceWarning}` : "",
        ctx.ragContext ? `\nRetrieved Knowledge Context:\n${ctx.ragContext}` : "",
        ctx.communityContext ? `\nRetrieved Community Context:\n${ctx.communityContext}` : "",
        `\n[CRITICAL INSTRUCTION]: You MUST write your final response entirely in the SAME LANGUAGE as the user's question. If the user's language is unclear or the input is just an image, you MUST strictly write the response in ${languageName} and NO OTHER LANGUAGE. Do NOT include any source metadata, document IDs, relevance scores, or raw chunk text in your response.`,
        diagnosisFormatInstruction,
        `\n[GARDEN EXTRACTION REQUIREMENT]
If the user's query or the uploaded image indicates they are interacting with a plant (and NOT a disease), you MUST extract the plant's parameters into a JSON block at the very end of your response. Use the exact format below, ensuring the block is wrapped in \`\`\`json ... \`\`\`
\`\`\`json
{
  "gardenExtraction": {
    "name": "Suggest a friendly nickname or use the prediction",
    "species": "The scientific name or prediction",
    "location": "Suggest the best location (e.g., Indoor, Outdoor, Balcony, Living Room)",
    "waterFrequencyDays": <number of days between watering, e.g. 3>,
    "healthStatus": "Healthy or Needs Care"
  }
}
\`\`\`
Do NOT omit this JSON block if the mode is plant identification.`
    ]
        .filter(Boolean)
        .join("\n");
};
exports.buildAssistantPrompt = buildAssistantPrompt;
