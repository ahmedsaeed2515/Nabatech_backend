import axios from "axios";
import { AiSettingsShape } from "./ai_config_service";
import { AiProviderError, toProviderError } from "./ai_errors";

export type RagResult = {
  message: string;
  source: "rag";
  provider: string;
};

export const askRag = async (
  settings: AiSettingsShape,
  question: string,
  history: Array<{ role: string; content: string }>,
  topK?: number
): Promise<RagResult> => {
  if (!settings.rag.enabled || !settings.rag.endpointUrl) {
    throw new AiProviderError("RAG disabled or not configured", {
      code: "RAG_NOT_CONFIGURED",
      isUpstream: false,
    });
  }

  let response: any;
  try {
    const ragApiKey = (settings.secrets.ragApiKey || "").trim();
    
    // Context Assembly bounds token limits
    const maxHistoryItems = 5;
    const boundedHistory = history.slice(-maxHistoryItems);
    const boundedQuestion = question.substring(0, 1000); // Max 1000 chars

    response = await axios.post(
      settings.rag.endpointUrl,
      {
        question: boundedQuestion,
        history: boundedHistory,
        top_k: topK || settings.rag.topK,
      },
      {
        timeout: settings.rag.timeoutMs,
        headers: ragApiKey ? { Authorization: `Bearer ${ragApiKey}` } : undefined,
      }
    );
  } catch (error) {
    throw toProviderError(error, "RAG provider request failed", "RAG_UPSTREAM_FAILED");
  }

  const data = (response.data || {}) as any;
  const message = (data.answer || data.response || data.result || data.message || "").toString().trim();
  if (!message) {
    throw new AiProviderError("Empty response from RAG provider", {
      code: "RAG_EMPTY_RESPONSE",
    });
  }

  return { message, source: "rag", provider: "rag" };
};
