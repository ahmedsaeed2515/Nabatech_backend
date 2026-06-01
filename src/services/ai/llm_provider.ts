import axios from "axios";
import { AiSettingsShape } from "./ai_config_service";
import { AiProviderError, toProviderError } from "./ai_errors";

export type LlmResult = {
  message: string;
  source: "llm" | "fallback";
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

const callProvider = async (args: {
  providerType: "generic_llm" | "openai_compatible" | "anthropic" | "gemini" | "cohere" | "huggingface_inference" | "ollama";
  endpointUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  systemPrompt: string;
  message: string;
}): Promise<string> => {
  if (args.providerType === "generic_llm" || args.providerType === "openai_compatible") {
    const response = await axios.post<OpenAiCompletionResponse>(
      args.endpointUrl,
      {
        model: args.model,
        messages: [
          { role: "system", content: args.systemPrompt },
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
        messages: [{ role: "user", content: args.message }],
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
    const response = await axios.post<CohereResponse>(
      args.endpointUrl,
      {
        model: args.model,
        message: args.message,
        preamble: args.systemPrompt,
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
    const response = await axios.post<HuggingFaceInferenceResponse>(
      args.endpointUrl,
      {
        inputs: `${args.systemPrompt}\n\nUser: ${args.message}`,
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

  const response = await axios.post<GeminiResponse>(
    `${args.endpointUrl}${args.endpointUrl.includes("?") ? "&" : "?"}key=${encodeURIComponent(args.apiKey)}`,
    {
      contents: [{ role: "user", parts: [{ text: args.message }] }],
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

export const askLlm = async (
  settings: AiSettingsShape,
  message: string,
  source: "llm" | "fallback" = "llm"
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
      const answer = await callProvider({
        providerType: candidate.providerType || "generic_llm",
        endpointUrl: candidate.endpointUrl,
        model: candidate.model,
        apiKey,
        timeoutMs: candidate.timeoutMs || settings.llm.timeoutMs,
        systemPrompt: settings.llm.systemPrompt,
        message,
      });
      if (!answer) {
        lastError = new AiProviderError(`Empty response from ${candidate.name}`, { code: "LLM_EMPTY_RESPONSE" });
        continue;
      }
      return { message: answer, source, provider: candidate.name || "llm" };
    } catch (error) {
      lastError = toProviderError(error, `LLM provider request failed (${candidate.name})`, "LLM_UPSTREAM_FAILED");
    }
  }

  throw lastError instanceof Error ? lastError : new AiProviderError("No LLM provider succeeded", { code: "LLM_ALL_FAILED" });
};
