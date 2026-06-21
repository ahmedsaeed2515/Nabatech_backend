export type AssistantContext = {
  userQuestion: string;
  history: Array<{ role: string; content: string }>;
  cnn?: {
    prediction: string;
    confidence?: number;
    candidates?: Array<{ label: string; confidence?: number }>;
  };
  lowConfidenceWarning?: string;
  kbAdvice?: string;
  kbSeverity?: string;
  ragContext?: string; // Retrieved context from RAG (injected AFTER retrieval)
  communityContext?: string; // Retrieved context from community database
  language?: string; // User's interface language
};

const formatCandidates = (candidates: Array<{ label: string; confidence?: number }> = []): string => {
  if (!candidates.length) return "none";
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
export const extractRagQuery = (userQuestion: string): string => {
  const q = (userQuestion || "").trim();
  if (!q || q.length < 3) {
    return "plant disease diagnosis and treatment";
  }
  // Truncate to 500 chars max for RAG embedding safety
  return q.substring(0, 500);
};

const LANGUAGE_MAP: Record<string, string> = {
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
export const buildAssistantPrompt = (ctx: AssistantContext): string => {
  const languageName = ctx.language ? (LANGUAGE_MAP[ctx.language.toLowerCase()] || ctx.language) : "English";

  let diagnosisFormatInstruction = "";
  if (ctx.cnn?.prediction) {
    diagnosisFormatInstruction = `\n[FORMAT REQUIREMENT]
Since the user uploaded an image for diagnosis, you MUST format your response EXACTLY like this:

Disease: [Clean Disease Name, e.g. Apple Scab]
Confidence: [Confidence %]
Description: [Short description]
Treatment:
• [Step 1]
• [Step 2]
Prevention:
• [Step 1]
• [Step 2]

Do NOT use underscores in disease names (use "Apple Scab", not "Apple_Scab").`;
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
    `\n[CRITICAL INSTRUCTION]: You MUST write your final response entirely in ${languageName}. Never use Hindi, Chinese, or any other unrelated language unless explicitly requested. Do NOT include any source metadata, document IDs, relevance scores, or raw chunk text in your response.`,
    diagnosisFormatInstruction
  ]
    .filter(Boolean)
    .join("\n");
};
