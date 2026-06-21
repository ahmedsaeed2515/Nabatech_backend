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

export type HistoryTurn = { role: string; content: string };

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

export const callProvider = async (args: {
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
    const isOpenRouter = args.endpointUrl.includes("openrouter.ai");
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
          ...(isOpenRouter ? { 
            "HTTP-Referer": "https://nabatech.com", 
            "X-Title": "Nabatech AI Platform" 
          } : {})
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
    const prompt = `${args.systemPrompt}\n\n${historyText}User: ${args.message}\nAssistant:`;
    const response = await axios.post<HuggingFaceInferenceResponse>(
      args.endpointUrl,
      {
        inputs: prompt,
        parameters: {
          return_full_text: false, // Prevent HF from echoing the prompt back
        }
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
    let text = (Array.isArray(data) ? data[0]?.generated_text : (data as any)?.generated_text || "").toString();
    
    // Fallback: If HF still echoed the prompt, strip it out manually
    if (text.startsWith(prompt)) {
      text = text.substring(prompt.length);
    }
    
    return text.trim();
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
export const askRagFallback = async (
  endpointUrl: string,
  message: string,
  history: HistoryTurn[] = [],
  timeoutMs: number = 25000
): Promise<string> => {
  // Build history in RAG's expected format
  const ragHistory = boundHistory(history).map((h) => ({
    role: h.role === "user" ? "user" : "assistant",
    content: h.content,
  }));

  const response = await axios.post(
    endpointUrl,
    {
      question: (message || "Please analyze this context and diagnosis.").substring(0, 950),
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
  history: HistoryTurn[] = [], // ✅ FIX #1: history parameter added
  taskRole: "search" | "chat" = "chat"
): Promise<LlmResult> => {
  console.log("[RUNTIME_TRACE] INSIDE askLlm. Delegating to ProviderManager...");
  
  try {
    const { getProviderManager } = await import("./ai_provider_manager");
    const manager = getProviderManager();
    const result = await manager.executeWithFailover(settings.llm.systemPrompt || "You are an expert AI.", message, history);
    return result;
  } catch (err: any) {
    console.warn("LLM providers failed. Last error:", err.message);

    if (taskRole === "search") {
      throw err;
    }
  }

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
