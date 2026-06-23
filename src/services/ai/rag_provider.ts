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

  const sanitizedDisease = diseaseName.trim().substring(0, 200) || "General";
  const skipPhrases = ["please analyze", "analyze this", "analyze my", "please check"];
  const lowerQ = (question || "").toLowerCase();
  const usefulQuestion = question && !skipPhrases.some((p) => lowerQ.includes(p)) ? question.substring(0, 500) : "";

  const payload = {
    disease_name: sanitizedDisease,
    question: usefulQuestion,
    top_k: topK || settings.rag.topK || 8,
    language: language,
    crop: crop,
  };

  // ── RAG Priority Chain ──────────────────────────────────────────────────────────
  const endpointsToTry: string[] = [];
  if (settings.rag.endpointUrl) endpointsToTry.push(settings.rag.endpointUrl);
  if (settings.hfIntegrated?.v8EndpointUrl) endpointsToTry.push(settings.hfIntegrated.v8EndpointUrl);
  if (settings.hfIntegrated?.v62EndpointUrl) endpointsToTry.push(settings.hfIntegrated.v62EndpointUrl);
  
  // Remove duplicates
  const uniqueEndpoints = [...new Set(endpointsToTry)];

  let response: any;
  let lastError: any;
  let successUrl = "";

  for (const rawEndpoint of uniqueEndpoints) {
    const baseUrl = rawEndpoint.replace(/\/ask(\/stream)?$/, "").replace(/\/$/, "");
    const retrieveUrl = `${baseUrl}/retrieve`;
    
    try {
      console.log(`[RAG_RETRIEVE] Attempting: ${retrieveUrl} for "${sanitizedDisease}"`);
      response = await axios.post(retrieveUrl, payload, {
        timeout: Math.max(settings.rag.timeoutMs || 40000, 45000), // Give at least 45s for cold boot
        headers: ragApiKey ? { Authorization: `Bearer ${ragApiKey}` } : undefined,
      });
      successUrl = retrieveUrl;
      lastError = null;
      break; // Success!
    } catch (error: any) {
      console.warn(`[RAG_RETRIEVE] Failed at ${retrieveUrl}: ${error.message}`);
      lastError = error;
    }
  }

  if (lastError || !response) {
    throw toProviderError(lastError, "RAG /retrieve request failed on all endpoints for disease: ", "RAG_UPSTREAM_FAILED");
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
  
  // 1. Strict metadata filtering
  if (crop) {
    filteredChunks = rawChunks.filter((c) => {
      const chunkCrop = c.metadata?.crop || c.crop || "";
      return chunkCrop === "" || chunkCrop.toLowerCase().includes(crop.toLowerCase());
    });
  }

  // 2. Semantic Similarity Threshold
  const MIN_SCORE = 0.45;
  filteredChunks = filteredChunks.filter(c => {
    if (typeof c.score === "number") {
      // If score is similarity, filter low values. If distance, filter high values. 
      // Assuming score is similarity normalized 0-1 based on previous code.
      if (c.score < MIN_SCORE) return false;
    }
    return true;
  });

  // 3. Keyword/Crop Contamination Check for Text Chat
  // If no crop was provided, but the question explicitly mentions a crop, reject chunks from obviously different crops.
  if (!crop && question) {
    const qLower = question.toLowerCase();
    const commonCrops = ["tomato", "potato", "onion", "wheat", "cotton", "mustard", "mango", "apple", "basil", "corn", "rice"];
    const mentionedCrops = commonCrops.filter(c => qLower.includes(c));
    
    if (mentionedCrops.length > 0) {
      filteredChunks = filteredChunks.filter(c => {
        const textLower = (c.text || "").toLowerCase();
        // If the chunk mentions a common crop that wasn't in the question, penalize/reject it
        const chunkMentionsOtherCrops = commonCrops.some(otherCrop => 
          !mentionedCrops.includes(otherCrop) && textLower.includes(otherCrop) && !textLower.includes(mentionedCrops[0])
        );
        return !chunkMentionsOtherCrops;
      });
    }
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


