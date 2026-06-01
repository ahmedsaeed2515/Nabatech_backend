export type AssistantContext = {
  userQuestion: string;
  history: Array<{ role: string; content: string }>;
  cnn?: {
    prediction: string;
    confidence?: number;
    candidates?: Array<{ label: string; confidence?: number }>;
  };
  lowConfidenceWarning?: string;
};

const formatCandidates = (candidates: Array<{ label: string; confidence?: number }> = []): string => {
  if (!candidates.length) return "none";
  return candidates
    .slice(0, 5)
    .map((c) => `${c.label}${typeof c.confidence === "number" ? ` (${(c.confidence * 100).toFixed(1)}%)` : ""}`)
    .join(", ");
};

export const buildAssistantPrompt = (ctx: AssistantContext): string => {
  return [
    "You are an agriculture assistant for plant disease help.",
    "Follow these rules:",
    "- Answer in the user's language when possible.",
    "- Do not claim direct image vision access.",
    "- Explain likely disease and safe treatment steps.",
    "- Avoid unsafe chemical advice.",
    "- If confidence is low, ask for a clearer image.",
    "",
    `User question: ${ctx.userQuestion || "No explicit question provided."}`,
    `Recent history count: ${ctx.history.length}`,
    `CNN prediction: ${ctx.cnn?.prediction || "not available"}`,
    `CNN confidence: ${typeof ctx.cnn?.confidence === "number" ? ctx.cnn.confidence.toFixed(3) : "not available"}`,
    `CNN candidates: ${formatCandidates(ctx.cnn?.candidates || [])}`,
    `Low confidence warning: ${ctx.lowConfidenceWarning || "none"}`,
  ].join("\n");
};

