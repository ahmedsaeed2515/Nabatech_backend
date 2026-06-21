import axios from "axios";
import { AiSettingsShape } from "./ai_config_service";
import { AiProviderError, toProviderError } from "./ai_errors";

// ?? Types ?????????????????????????????????????????????????????????????????????

export type RagChunk = {
  text: string;
  source: string;
  score: number;
};

export type RagResult = {
  contextText: string;
  chunks: RagChunk[];
  totalFound: number;
  source: "rag";
  provider: string;
};

// ?? Helpers ???????????????????????????????????????????????????????????????????

const formatChunksAsContext = (chunks: RagChunk[]): string => {
  if (!chunks.length) return "";
  return chunks
    .map(
      (chunk, i) =>
        `[${i + 1}] [Source: ${chunk.source} | Relevance: ${(chunk.score * 100).toFixed(1)}%]:\n${chunk.text.trim()}`
    )
    .join("\n\n---\n\n");
};

// ?? Primary export ?????????????????????????????????????????????????????????????

export const retrieveRagChunks = async (
  settings: AiSettingsShape,
  diseaseName: string,
  question?: string,
  topK?: number,
  language?: string,
  crop?: string
): Promise<RagResult> => {
  if (!settings.rag.enabled || !settings.rag.endpointUrl) {
    throw new AiProviderError("RAG disabled or not configured", {
      code: "RAG_NOT_CONFIGURED",
      isUpstream: false,
    });
  }

  const ragApiKey = (settings.secrets.ragApiKey || "").trim();

  // FIX [TASK-0.1]: Append ragApiKey to Bearer token — was always empty before
  if (ragApiKey) console.log(`[RAG] Auth configured: Bearer ***${ragApiKey.slice(-4)}`);

  const rawEndpoint = process.env.NEW_RAG_URL || settings.rag.endpointUrl;
  const baseUrl = rawEndpoint
    .replace(/\/ask(\/stream)?$/, "")
    .replace(/\/$/, "");
  const retrieveUrl = `${baseUrl}/retrieve`;

  const sanitizedDisease = diseaseName.trim().substring(0, 200);

  const skipPhrases = ["please analyze", "analyze this", "analyze my", "please check"];
  const lowerQ = (question || "").toLowerCase();
  const usefulQuestion =
    question && !skipPhrases.some((p) => lowerQ.includes(p))
      ? question.substring(0, 500)
      : "";

  let response: any;
  try {
    response = await axios.post(
      retrieveUrl,
      {
        disease_name: sanitizedDisease,
        question: usefulQuestion,
        top_k: topK || settings.rag.topK || 8,
        language: language,
        crop: crop,
      },
      {
        timeout: settings.rag.timeoutMs,
        headers: ragApiKey ? { Authorization: `Bearer ${ragApiKey}` } : undefined,
      }
    );
  } catch (error) {
    throw toProviderError(
      error,
      "RAG /retrieve request failed for disease: ",
      "RAG_UPSTREAM_FAILED"
    );
  }

  const data = (response.data || {}) as any;
  const rawChunks: any[] = Array.isArray(data.chunks) ? data.chunks : [];

  if (!rawChunks.length) {
    throw new AiProviderError(
      "RAG returned no chunks for disease: ",
      { code: "RAG_EMPTY_RESPONSE" }
    );
  }

  let filteredChunks = rawChunks;
  if (crop) {
    filteredChunks = rawChunks.filter((c) => {
      const chunkCrop = c.metadata?.crop || c.crop || "";
      return chunkCrop === "" || chunkCrop.toLowerCase() === crop.toLowerCase();
    });
  }

  const chunks: RagChunk[] = filteredChunks
    .filter((c) => c && typeof c.text === "string" && c.text.trim().length > 10)
    .map((c) => ({
      text: String(c.text).trim(),
      source: String(c.source || "Unknown").trim(),
      score: typeof c.score === "number" ? Math.max(0, Math.min(1, c.score)) : 0,
    }));

  if (!chunks.length) {
    throw new AiProviderError("RAG chunks were all empty or malformed", {
      code: "RAG_INVALID_RESPONSE",
    });
  }

  const contextText = formatChunksAsContext(chunks);

  console.log(
    `[RAG_RETRIEVE_SUCCESS] disease="${sanitizedDisease}" | chunks=${chunks.length}`
  );

  return {
    contextText,
    chunks,
    totalFound: data.total_found || chunks.length,
    source: "rag",
    provider: "rag",
  };
};


