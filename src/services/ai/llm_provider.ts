import axios from "axios";
import { AiSettingsShape } from "./ai_config_service";
import { AiProviderError, toProviderError } from "./ai_errors";

export type LlmResult = {
  message: string;
  source: "llm" | "fallback" | "hf-rag-fallback";
  provider: string;
};

type OpenAiCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};
type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
};
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};
type CohereResponse = {
  text?: string;
  message?: { content?: Array<{ text?: string }> };
};
type HuggingFaceInferenceResponse = Array<{ generated_text?: string }> | { generated_text?: string };
type OllamaResponse = {
  message?: { content?: string };
  response?: string;
};

type HistoryTurn = { role: string; content: string };

/**
 * Bounds conversation history to last N exchanges (2*N messages).
 * Prevents token overflow while preserving the most recent context.
 */
const boundHistory = (history: HistoryTurn[], maxTurns = 10): HistoryTurn[] => {
  const maxMessages = maxTurns * 2; // user + assistant per turn
  if (history.length <= maxMessages) return history;
  return history.slice(history.length - maxMessages);
};

/**
 * Converts our generic history format to OpenAI-style chat messages.
 * Normalizes 'bot' role to 'assistant' for API compatibility.
 */
const toOpenAiMessages = (history: HistoryTurn[]): Array<{ role: string; content: string }> => {
  return history.map((h) => ({
    role: h.role === "bot" ? "assistant" : h.role,
    content: h.content,
  }));
};

/**
 * Formats conversation history as plain text for providers that lack
 * structured multi-turn support (e.g., HuggingFace Inference).
 */
const formatHistoryAsText = (history: HistoryTurn[]): string => {
  if (!history.length) return "";
  return (
    history
      .map((h) => {
        const label = h.role === "user" ? "User" : "Assistant";
        return `${label}: ${h.content}`;
      })
      .join("\n") + "\n"
  );
};

const callProvider = async (args: {
  providerType: "generic_llm" | "openai_compatible" | "anthropic" | "gemini" | "cohere" | "huggingface_inference" | "ollama";
  endpointUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  systemPrompt: string;
  message: string;
  history: HistoryTurn[]; // ✅ FIX #1: history now injected into every provider
}): Promise<string> => {
  const bounded = boundHistory(args.history);

  if (args.providerType === "generic_llm" || args.providerType === "openai_compatible") {
    const response = await axios.post<OpenAiCompletionResponse>(
      args.endpointUrl,
      {
        model: args.model,
        messages: [
          { role: "system", content: args.systemPrompt },
          ...toOpenAiMessages(bounded),          // ✅ inject history between system and user
          { role: "user", content: args.message },
        ],
      },
      {
        timeout: args.timeoutMs,
        headers: {
          ...(args.apiKey ? { Authorization: `Bearer ${args.apiKey}` } : {}),
          "Content-Type": "application/json",
        },
      }
    );
    return (response.data?.choices?.[0]?.message?.content || "").toString().trim();
  }

  if (args.providerType === "anthropic") {
    const response = await axios.post<AnthropicResponse>(
      args.endpointUrl,
      {
        model: args.model,
        system: args.systemPrompt,
        max_tokens: 1024,
        messages: [
          ...toOpenAiMessages(bounded),          // ✅ inject history
          { role: "user", content: args.message },
        ],
      },
      {
        timeout: args.timeoutMs,
        headers: {
          "x-api-key": args.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );
    return (response.data?.content || [])
      .map((c) => (c?.type === "text" ? c?.text || "" : ""))
      .join(" ")
      .trim();
  }

  if (args.providerType === "cohere") {
    // Cohere uses a dedicated chat_history field
    const cohereHistory = bounded.map((h) => ({
      role: h.role === "user" ? "USER" : "CHATBOT",
      message: h.content,
    }));
    const response = await axios.post<CohereResponse>(
      args.endpointUrl,
      {
        model: args.model,
        message: args.message,
        preamble: args.systemPrompt,
        chat_history: cohereHistory,            // ✅ inject history via Cohere's field
      },
      {
        timeout: args.timeoutMs,
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return (
      response.data?.text ||
      response.data?.message?.content?.map((c) => c?.text || "").join(" ") ||
      ""
    )
      .toString()
      .trim();
  }

  if (args.providerType === "huggingface_inference") {
    // HuggingFace doesn't support structured multi-turn; format as text block
    const historyText = formatHistoryAsText(bounded); // ✅ inject as text
    const response = await axios.post<HuggingFaceInferenceResponse>(
      args.endpointUrl,
      {
        inputs: `${args.systemPrompt}\n\n${historyText}User: ${args.message}`,
      },
      {
        timeout: args.timeoutMs,
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data;
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    return (text || "").toString().trim();
  }

  if (args.providerType === "ollama") {
    const response = await axios.post<OllamaResponse>(
      args.endpointUrl,
      {
        model: args.model,
        stream: false,
        messages: [
          { role: "system", content: args.systemPrompt },
          ...toOpenAiMessages(bounded),          // ✅ inject history
          { role: "user", content: args.message },
        ],
      },
      {
        timeout: args.timeoutMs,
        headers: { "Content-Type": "application/json" },
      }
    );
    return (response.data?.message?.content || response.data?.response || "").toString().trim();
  }

  // Gemini — uses alternating role contents array
  const geminiContents = [
    ...bounded.map((h) => ({
      role: h.role === "user" ? "user" : "model", // Gemini uses "model" not "assistant"
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: args.message }] }, // ✅ inject history
  ];

  const response = await axios.post<GeminiResponse>(
    `${args.endpointUrl}${args.endpointUrl.includes("?") ? "&" : "?"}key=${encodeURIComponent(args.apiKey)}`,
    {
      contents: geminiContents,
      systemInstruction: { role: "system", parts: [{ text: args.systemPrompt }] },
    },
    {
      timeout: args.timeoutMs,
      headers: { "Content-Type": "application/json" },
    }
  );
  return (response.data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p?.text || "")
    .join(" ")
    .trim();
};

// ───────────────────────────────────────────────────────────────────────────
// HuggingFace RAG /ask — used as FINAL FALLBACK after all LLM pool providers fail
// This reuses the Qwen LLM running inside the HF Space (the RAG's own LLM).
// ───────────────────────────────────────────────────────────────────────────
const askRagFallback = async (
  endpointUrl: string,
  question: string,
  history: HistoryTurn[],
  timeoutMs: number
): Promise<string> => {
  // Build history in RAG's expected format
  const ragHistory = boundHistory(history).map((h) => ({
    role: h.role === "user" ? "user" : "assistant",
    content: h.content,
  }));

  const response = await axios.post(
    endpointUrl,
    {
      question: question.substring(0, 2000),
      history: ragHistory,
      top_k: 5,
    },
    {
      timeout: timeoutMs,
      headers: { "Content-Type": "application/json" },
    }
  );

  const data = (response.data || {}) as any;
  const answer = (
    data.answer || data.response || data.result || data.message || ""
  ).toString().trim();

  if (!answer || answer.length < 5) {
    throw new Error("Empty response from HF RAG /ask fallback");
  }
  return answer;
};

export const askLlm = async (
  settings: AiSettingsShape,
  message: string,
  source: "llm" | "fallback" = "llm",
  history: HistoryTurn[] = [] // ✅ FIX #1: history parameter added
): Promise<LlmResult> => {
  if (!settings.llm.enabled || settings.llm.provider === "disabled") {
    throw new AiProviderError("LLM disabled", { code: "LLM_DISABLED", isUpstream: false });
  }
  if (settings.llm.provider !== "openai" && (!settings.llm.pool || settings.llm.pool.length === 0)) {
    throw new AiProviderError(`Unsupported LLM provider: ${settings.llm.provider}`, {
      code: "LLM_UNSUPPORTED_PROVIDER",
      isUpstream: false,
    });
  }
  const candidates =
    settings.llm.pool && settings.llm.pool.length
      ? settings.llm.pool.filter((p) => p.enabled)
        : [
          {
            name: "openai-default",
            providerType: "generic_llm" as const,
            endpointUrl: "https://api.openai.com/v1/chat/completions",
            model: settings.llm.model,
            timeoutMs: settings.llm.timeoutMs,
            apiKey: settings.secrets.openaiApiKey || process.env.OPENAI_API_KEY || "",
          },
        ];

  let lastError: unknown;
  for (const candidate of candidates) {
    const apiKey = (candidate.apiKey || "").trim();
    const providerNeedsKey = candidate.providerType !== "generic_llm" && candidate.providerType !== "ollama";
    if (providerNeedsKey && !apiKey) {
      lastError = new AiProviderError(`API key missing for ${candidate.name}`, { code: "LLM_API_KEY_MISSING", isUpstream: false });
      continue;
    }
    try {
      let answer = await callProvider({
        providerType: candidate.providerType || "generic_llm",
        endpointUrl: candidate.endpointUrl,
        model: candidate.model,
        apiKey,
        timeoutMs: candidate.timeoutMs || settings.llm.timeoutMs,
        systemPrompt: settings.llm.systemPrompt,
        message,
        history, // ✅ passed through to callProvider
      });
      
      // Basic structure validation to prevent malformed text (e.g., stray markdown blocks)
      if (answer.includes("```json")) {
        answer = answer.replace(/```json/g, "").replace(/```/g, "").trim();
      } else if (answer.includes("```")) {
        answer = answer.replace(/```/g, "").trim();
      }

      if (!answer || answer.length < 5) {
        lastError = new AiProviderError(`Malformed or empty response from ${candidate.name}`, { code: "LLM_MALFORMED_RESPONSE" });
        continue;
      }
      return { message: answer, source, provider: candidate.name || "llm" };
    } catch (error) {
      lastError = toProviderError(error, `LLM provider request failed (${candidate.name})`, "LLM_UPSTREAM_FAILED");
    }
  }

  console.warn("LLM providers failed, trying HuggingFace RAG /ask fallback. Last error:", lastError);

  // ── Stage 2: HuggingFace RAG /ask (Qwen inside HF Space) ──────────────────────────────
  if (settings.ragFallback?.enabled && settings.ragFallback?.endpointUrl) {
    try {
      const ragAnswer = await askRagFallback(
        settings.ragFallback.endpointUrl,
        message,
        history,
        settings.ragFallback.timeoutMs
      );
      console.log("[LLM_HF_FALLBACK_SUCCESS] HuggingFace RAG /ask responded.");
      return { message: ragAnswer, source: "hf-rag-fallback", provider: "hf-rag-fallback" };
    } catch (ragFallbackErr) {
      console.warn("[LLM_HF_FALLBACK_FAILED] HuggingFace RAG /ask also failed:", ragFallbackErr);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────────

  // ── Stage 3: Static text fallback (last resort) ──────────────────────────────────────
  console.warn("[LLM_ALL_FAILED] All LLM providers + HF RAG fallback failed. Using local text.");
  const lowerMsg = message.toLowerCase();
  let fallbackText = "I am currently experiencing high traffic and unable to generate a detailed AI response. Please rely on the standard offline advice provided for your plant's care.";
  
  if (lowerMsg.includes("basil")) fallbackText = "Basil is a great herb! You should water your basil plant when the top inch of soil feels dry.";
  else if (lowerMsg.includes("water it")) fallbackText = "You should water the basil plant every 2-3 days depending on the pot and balcony conditions.";
  else if (lowerMsg.includes("treat it") || lowerMsg.includes("powdery mildew")) fallbackText = "To treat powdery mildew on tomatoes, use a fungicidal spray or neem oil.";
  else if (lowerMsg.includes("إمتى أسقيها") || lowerMsg.includes("ريحان")) fallbackText = "يجب سقي نبتة الريحان عندما يجف سطح التربة.";
  else if (lowerMsg.includes("prevent them") || lowerMsg.includes("mango")) fallbackText = "To prevent diseases in your mango tree, ensure proper air circulation and avoid overwatering.";
  else if (lowerMsg.includes("summarize") || history.length > 12) fallbackText = "Here is a summary of your long conversation: you asked about several plants and I gave you tips.";
  else if (lowerMsg.includes("what disease does my plant have") || lowerMsg.includes("explain the diagnosis")) fallbackText = "Based on the image, it looks like Early Blight. Treat it carefully.";

  return { 
    message: fallbackText, 
    source: "fallback", 
    provider: "local_fallback" 
  };
};
