import FormData from "form-data";
import AiCallLog from "../../models/ai_call_log_model";
import { askLlm } from "./llm_provider";
import { retrieveRagChunks } from "./rag_provider";
import { runCnnDiagnosis } from "./cnn_provider";
import { getAiSettings } from "./ai_config_service";
import { sanitizeErrorMessage } from "./ai_errors";
import { buildAssistantPrompt, extractRagQuery } from "./assistant_prompt_builder";
import { retrieveCommunityContext } from "./community_knowledge_retriever";
import crypto from "crypto";
import { AgentLlmProvider } from "./agent_llm_provider";
import { AGENT_TOOLS } from "./agent_tool_registry";
import { MemoryManager } from "./memory_manager";
import { getProviderManager } from "./ai_provider_manager";
import { ExpertEscalationService } from "../expert_escalation_service";
import { askHuggingFaceIntegrated, HfMode } from "./hf_integrated_provider";

import { sanitizeModelOutput } from "../../utils/ai_sanitizer";

const sanitizeLlmResponse = (text: string): string => {
  if (!text) return text;
  // First run the new global sanitizer to strip <think> blocks
  let sanitized = sanitizeModelOutput(text);
  // Then strip specific local metadata tags
  return sanitized
    .replace(/\[source:.*?\]/gi, "")
    .replace(/\[doc:.*?\]/gi, "")
    .replace(/relevance:\s*[\d.]+/gi, "")
    .replace(/\[chunk_id:.*?\]/gi, "")
    .replace(/\[chunk.*?\]/gi, "")
    .replace(/\[id:.*?\]/gi, "")
    .replace(/\(source:.*?\)/gi, "")
    .trim();
};

const logAiCall = async (payload: {
  userId?: string;
  requestId?: string;
  feature: "diagnosis" | "chat" | "image_chat";
  provider: string;
  model?: string;
  sourceIds?: string[];
  status: "success" | "failure";
  latencyMs: number;
  cost?: number;
  tokensUsed?: number;
  routedFrom?: string[];
  inputMeta?: Record<string, unknown>;
  outputMeta?: Record<string, unknown>;
  errorMessage?: string;
  toolCalls?: any[];
}) => {
  try {
    await AiCallLog.create(payload);
  } catch (error) {
    console.warn("AI call logging failed:", sanitizeErrorMessage(error));
  }
};

const validateProviderOutput = (result: any) => {
  if (result && typeof result.confidence === "number") {
    if (result.confidence < 0) result.confidence = 0;
    if (result.confidence > 1) result.confidence = 1;
  }
  if (result && result.prediction && typeof result.prediction === "string") {
    result.prediction = result.prediction.trim();
    if (result.prediction.length === 0) {
      throw new Error("Provider returned empty prediction");
    }
  }
  if (result && Array.isArray(result.candidates)) {
    if (result.candidates.length > 10) {
      result.candidates = result.candidates.slice(0, 10);
    }
  }
  return result;
};

// --- Text Caching (Phase 4) ---
interface CacheEntry {
  response: any;
  expiresAt: number;
}
const textCache = new Map<string, CacheEntry>();

function getCacheKey(question: string): string {
  // Remove punctuation, keep alphanumeric and Arabic characters, and collapse spaces
  return question
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, "")
    .replace(/\s+/g, " ");
}
// ------------------------------

export const orchestrateDiagnosis = async (args: {
  userId?: string;
  requestId?: string;
  fileBuffer: Buffer;
  originalName: string;
}) => {
  const started = Date.now();
  const settings = await getAiSettings();
  const reqId = args.requestId || crypto.randomUUID();

  const formData = new FormData();
  formData.append("file", args.fileBuffer, { filename: args.originalName || "image.jpg" });

  try {
    const rawResult = await runCnnDiagnosis(settings, formData, formData.getHeaders() as Record<string, string>);
    const result = validateProviderOutput(rawResult);
    
    await logAiCall({
      userId: args.userId,
      requestId: reqId,
      feature: "diagnosis",
      provider: result.provider,
      status: "success",
      latencyMs: Date.now() - started,
      inputMeta: { filename: args.originalName, bytes: args.fileBuffer.length },
      outputMeta: { confidence: result.confidence, candidatesCount: result.candidates?.length || 0 },
    });
    return result;
  } catch (error) {
    await logAiCall({
      userId: args.userId,
      requestId: reqId,
      feature: "diagnosis",
      provider: settings.cnn.provider,
      status: "failure",
      latencyMs: Date.now() - started,
      inputMeta: { filename: args.originalName, bytes: args.fileBuffer.length },
      errorMessage: sanitizeErrorMessage(error),
    });
    throw error;
  }
};

export const orchestrateChat = async (args: {
  userId?: string;
  requestId?: string;
  question: string;
  history: Array<{ role: string; content: string }>;
  topK?: number;
  language?: string;
  onProgress?: (phase: string) => void;
  onToken?: (token: string) => void; // ── NEW: streaming token callback
}) => {
  const settings = await getAiSettings();
  const started = Date.now();
  const reqId = args.requestId || crypto.randomUUID();
  const sanitizedHistory = args.history.filter(msg => msg.role !== "system");

  // --- Check Cache First (Phase 4) ---
  const cacheKey = getCacheKey(args.question);
  if (cacheKey.length > 5) {
    const cached = textCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      const latency = Date.now() - started;
      console.log(`[CACHE HIT] Found cached response for text question. Latency: ${latency}ms`);
      return cached.response;
    }
    console.log(`[CACHE MISS] No valid cache found for text question.`);
  }
  // -----------------------------------

  // ── AI Priority Routing ───────────────────────────────────────────────────────────
  const priorityList = Array.isArray((settings as any).aiModePriority) && (settings as any).aiModePriority.length > 0
    ? (settings as any).aiModePriority
    : ["rag_openai"];

  let shouldRunRagOpenai = false;

  for (const mode of priorityList) {
    if (mode === "rag_openai") {
      shouldRunRagOpenai = true;
      console.log(`[MODE_ROUTING] Priority reached rag_openai, breaking to main pipeline...`);
      break;
    }

    const hfMode = mode as HfMode;
    const hf = (settings as any).hfIntegrated || {};
    const endpointMap: Record<HfMode, string> = {
      hf_grok: hf.grokEndpointUrl || "",
      hf_v8:   hf.v8EndpointUrl   || "",
      hf_v62:  hf.v62EndpointUrl  || "",
    };
    const hfTimeout = hf.timeoutMs || 40_000;

    console.log(`[MODE_ROUTING] Attempting mode: ${hfMode} | question: "${args.question.slice(0, 60)}..."`);

    const hfResult = await askHuggingFaceIntegrated(
      hfMode,
      endpointMap[hfMode],
      args.question,
      sanitizedHistory as any,
      hfTimeout,
      args.language
    );

    if (hfResult.success) {
      await logAiCall({
        userId: args.userId,
        requestId: reqId,
        feature: "chat",
        provider: hfMode,
        status: "success",
        latencyMs: hfResult.latencyMs,
        inputMeta: { mode: hfMode, questionLength: args.question.length },
        outputMeta: { responseLength: hfResult.answer.length },
      });
      const finalResponse = {
        message: sanitizeLlmResponse(hfResult.answer),
        source: hfMode as any,
        provider: hfMode,
        ragContext: undefined,
        communityContext: undefined,
      };
      
      if (cacheKey.length > 5) {
        textCache.set(cacheKey, {
          response: finalResponse,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours TTL
        });
      }
      return finalResponse;
    }

    console.warn(`[MODE_ROUTING] ${hfMode} failed: ${hfResult.error}. Moving to next priority...`);
  }

  if (!shouldRunRagOpenai) {
    // Exhausted the list and rag_openai was not in it.
    return {
      message: `All selected AI modes failed to respond. Please try again later or adjust your AI priorities in the dashboard.`,
      source: "fallback" as any,
      provider: priorityList[0] || "unknown",
      ragContext: undefined,
      communityContext: undefined,
    };
  }
  // ── End AI Priority Routing ───────────────────────────────────────────────────────

  const isGreeting = /^(hello|hi|hey|greetings|good morning|good afternoon|good evening|howdy|what'?s up)\b/i.test(args.question.trim());
  const isSmallTalk = /^(how are you|who are you|thanks|thank you|bye|goodbye)\b/i.test(args.question.trim());
  const shouldSkipRag = isGreeting || isSmallTalk;

  if (args.onProgress) args.onProgress("LOADING_CONTEXT");

    const tContextStart = performance.now();
    const [ragResultData, commResultData, memoryContext, gardenContext] = await Promise.all([
      // 1. RAG Retrieval
      (async () => {
        if (shouldSkipRag || !settings.rag.enabled || !settings.rag.endpointUrl) return undefined;
        let optimizedQuery = args.question;

        try {
          const tRagStart = performance.now();
          const result = await retrieveRagChunks(settings, "", optimizedQuery, args.topK || 4, args.language);
          const tRagEnd = performance.now();
          console.log(`[PERF] RAG Retrieval: ${(tRagEnd - tRagStart).toFixed(2)}ms`);
          console.log(`[RAG_SUCCESS] ${result.chunks.length} chunks retrieved for text chat`);
          return result.contextText;
        } catch (error) {
          console.warn("[RAG_FAILED] RAG retrieval failed:", sanitizeErrorMessage(error));
          return undefined;
        }
      })(),

      // 2. Community Context Retrieval
      (async () => {
        try {
          const tCommStart = performance.now();
          const result = await retrieveCommunityContext(undefined, args.question);
          const tCommEnd = performance.now();
          console.log(`[PERF] Community Context Retrieval: ${(tCommEnd - tCommStart).toFixed(2)}ms`);
          return result.hasData ? { text: result.text, meta: result.meta } : undefined;
        } catch (error) {
          console.warn("Community context retrieval failed:", sanitizeErrorMessage(error));
          return undefined;
        }
      })(),

      // 3. Memory Retrieval
      (async () => {
        const tMemStart = performance.now();
        const res = await MemoryManager.getAllContext(args.userId || "anonymous");
        const tMemEnd = performance.now();
        console.log(`[PERF] Memory Context Retrieval: ${(tMemEnd - tMemStart).toFixed(2)}ms`);
        return res;
      })(),

      // 4. Deep Garden Context
      (async () => {
        if (!args.userId) return undefined;
        try {
          const tGardenStart = performance.now();
          const PlantModel = (await import("../../models/plant_model")).default;
          const plants = await PlantModel.find({ user: args.userId }).lean();
          const tGardenEnd = performance.now();
          console.log(`[PERF] Garden Context Retrieval: ${(tGardenEnd - tGardenStart).toFixed(2)}ms`);
          if (!plants || plants.length === 0) return "User has no plants in their garden.";
          return "User's Garden Plants: " + JSON.stringify(plants.map((p: any) => ({
            name: p.name, species: p.species, stage: p.stage, health: p.healthScore, lastWatered: p.lastWatered
          })));
        } catch (e) { return undefined; }
      })()
    ]);
    const tContextEnd = performance.now();
    console.log(`[PERF] Total Context Parallel Gathering: ${(tContextEnd - tContextStart).toFixed(2)}ms`);

    const ragContext = ragResultData;
  const communityContext = commResultData;
  const systemPromptAddition = `\n\nUser Profile & Memory Context: ${JSON.stringify(memoryContext)}\n\n${gardenContext || ""}`;
  
  const prompt = buildAssistantPrompt({
    userQuestion: args.question,
    history: sanitizedHistory,
    ragContext,
    communityContext: communityContext ? (communityContext as any).text : undefined,
    language: args.language,
  }) + systemPromptAddition;

  // ✅ PERFORMANCE FIX: Skip the slow multi-step Agent Loop for regular chat.
  // The Agent Loop (up to 15 iterations, each with a 15s timeout) was the primary
  // cause of slow responses and timeouts.
  // For regular chat: Use direct fast LLM call, and save memory to background.
  // The Agent Loop is only triggered for explicit tool-action requests (e.g., 'add plant', 'schedule reminder').
  const TOOL_TRIGGER_REGEX = /\b(add|remove|schedule|remind|create post|create a post|publish|watering reminder|weather|forecast|expert|companion plant)\b/i;
  const requiresToolAction = args.userId && settings.llm.enabled && TOOL_TRIGGER_REGEX.test(args.question);

  let chatResult: { message: string; source: "llm" | "fallback" | "rag" | "cnn" | "hf-rag-fallback"; provider: string; toolCalls?: any[]; pendingToolCall?: any };

  if (requiresToolAction) {
    console.log("[AGENT] Tool action detected, running Agent Loop (background-safe)");
    try {
      const agentProvider = new AgentLlmProvider();
      const agentResult = await agentProvider.runAgentLoop(
        settings,
        args.userId!,
        prompt,
        sanitizedHistory,
        AGENT_TOOLS,
        8, // Reduced from 15 to avoid extreme timeouts
        args.onProgress
      );
      chatResult = { message: agentResult.message, source: "llm", provider: "agent_llm", toolCalls: agentResult.toolCalls, pendingToolCall: (agentResult as any).pendingToolCall };
    } catch (agentErr: any) {
      console.warn("[AGENT_FAILED] Falling back to standard LLM flow. Error:", agentErr.message);
      if (args.onProgress) args.onProgress("SIMPLE_LLM_GENERATING");
      chatResult = await askLlm(settings, prompt, "llm", sanitizedHistory);
    }
  } else {
    // ✅ FAST PATH: Direct LLM call — no Agent Loop overhead
    if (args.onProgress) args.onProgress("SIMPLE_LLM_GENERATING");
    const tLlmStart = performance.now();
    chatResult = await askLlm(settings, prompt, "llm", sanitizedHistory, "chat", args.onToken);
    const tLlmEnd = performance.now();
    console.log(`[PERF] askLlm Execution: ${(tLlmEnd - tLlmStart).toFixed(2)}ms`);
  }

  // ✅ Save short-term memory in background (non-blocking)
  if (args.userId) {
    Promise.resolve().then(() =>
      MemoryManager.saveShortTermMemory(args.userId!, `last_chat_${reqId}`, args.question).catch(() => {})
    );
  }

  if (chatResult.source === "fallback") {
    console.warn("[LLM] All providers failed, using static fallback.");
  } else {
    console.log(`[LLM] Response from: ${chatResult.provider}`);
  }

  // Cascade logic
  if (chatResult.source === "fallback") {
    console.log("[FINAL_RESPONSE_SOURCE] fallback");
    chatResult.message = "I am currently experiencing high traffic and cannot generate a detailed response. Please try again later.";
  } else {
    console.log("[FINAL_RESPONSE_SOURCE] llm");
  }

  let finalMessage = sanitizeLlmResponse(chatResult.message);
  if (!finalMessage) {
    const isArabic = /[\\u0600-\\u06FF]/.test(args.question || "") || args.language === "ar";
    finalMessage = isArabic 
      ? "أواجه حاليًا ضغطًا كبيرًا ولا يمكنني إنشاء رد مفصل. يرجى المحاولة مرة أخرى لاحقًا."
      : "I am currently experiencing high traffic and cannot generate a detailed response. Please try again later.";
    chatResult.source = "fallback";
  }

  await logAiCall({
    userId: args.userId,
    requestId: reqId,
    feature: "chat",
    provider: chatResult.provider,
    status: chatResult.source === "fallback" ? "failure" : "success",
    latencyMs: Date.now() - started,
    inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
    outputMeta: { responseLength: finalMessage.length, source: chatResult.source },
    errorMessage: chatResult.source === "fallback" ? "No AI provider succeeded or response was empty" : undefined,
    toolCalls: chatResult.toolCalls,
  });

  const finalResponse = { message: finalMessage, source: chatResult.source, provider: chatResult.provider, ragContext, communityContext, pendingToolCall: (chatResult as any).pendingToolCall };

  if (cacheKey.length > 5 && chatResult.source !== "fallback") {
    textCache.set(cacheKey, {
      response: finalResponse,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });
  }

  return finalResponse;
};

export const orchestrateAssistantRequest = async (args: {
  userId?: string;
  requestId?: string;
  fileBuffer?: Buffer;
  originalName?: string;
  question?: string;
  history: Array<{ role: string; content: string }>;
  topK?: number;
  skipAdvice?: boolean;
  language?: string;
  onProgress?: (phase: string) => void;
}) => {
  const settings = await getAiSettings();
  const started = Date.now();
  const reqId = args.requestId || crypto.randomUUID();
  const question = (args.question || "").trim();
  const hasFile = Boolean(args.fileBuffer && args.fileBuffer.length);
  const sanitizedHistory = args.history.filter(msg => msg.role !== "system");

  if (!hasFile && !question) {
    throw new Error("Either file or question is required");
  }

  if (!hasFile && question) {
    const chat = await orchestrateChat({ userId: args.userId, requestId: reqId, question, history: sanitizedHistory, topK: args.topK, language: args.language, onProgress: args.onProgress });
    return { mode: "chat" as const, message: chat.message, source: chat.source, provider: chat.provider, providerChain: [chat.provider], ragContext: chat.ragContext, communityContext: chat.communityContext };
  }

  const providerChain: string[] = [];
  let cnnResult: Awaited<ReturnType<typeof runCnnDiagnosis>> | null = null;
  let lowConfidenceWarning = "";

  if (settings.pipeline.imageFirst) {
    try {
      const formData = new FormData();
      formData.append("file", args.fileBuffer!, { filename: args.originalName || "image.jpg" });
      const rawCnn = await runCnnDiagnosis(settings, formData, formData.getHeaders() as Record<string, string>);
      cnnResult = validateProviderOutput(rawCnn);
      console.log("\n[DEBUG_RUNTIME] CNN Diagnosis Result:", JSON.stringify(cnnResult, null, 2));
      providerChain.push("cnn");
      console.log("[CNN_SUCCESS]");
    } catch (error) {
      console.warn("[CNN_FAILED] CNN diagnosis failed:", sanitizeErrorMessage(error));
      if (!settings.pipeline.allowAnswerIfCnnFails) {
        await logAiCall({
          userId: args.userId,
          requestId: reqId,
          feature: "image_chat",
          provider: "cnn",
          status: "failure",
          latencyMs: Date.now() - started,
          inputMeta: { mode: "image_chat", providerChain: ["cnn"], historyCount: args.history.length },
          errorMessage: sanitizeErrorMessage(error),
        });
        throw error;
      }
    }
  }

  const isLowConfidence = Boolean(
    cnnResult &&
      typeof cnnResult.confidence === "number" &&
      cnnResult.confidence < settings.cnn.confidenceThreshold
  );

  let predictedCrop = "";
  let predictedDisease = cnnResult?.prediction || "";
  const isHealthy = predictedDisease.toLowerCase().includes("healthy");

  if (cnnResult?.prediction) {
    if (cnnResult.prediction.includes("___")) {
      const parts = cnnResult.prediction.split("___");
      predictedCrop = parts[0].replace(/_/g, " ").trim();
      predictedDisease = parts[1].replace(/_/g, " ").trim();
    } else if (cnnResult.prediction.includes("_")) {
      const parts = cnnResult.prediction.split("_");
      predictedCrop = parts[0].replace(/_/g, " ").trim();
      predictedDisease = parts.slice(1).join(" ").replace(/_/g, " ").trim();
    }
  }

  if (isLowConfidence && cnnResult) {
    const conf = typeof cnnResult.confidence === "number" ? cnnResult.confidence : 0;
    lowConfidenceWarning = `Low CNN confidence (${conf.toFixed(3)}) below threshold (${settings.cnn.confidenceThreshold.toFixed(3)}).`;
    
    // Automatically trigger Expert Escalation Workflow if user is logged in
    if (args.userId && args.originalName) {
      try {
        await ExpertEscalationService.requestExpertReview({
          userId: args.userId,
          aiPrediction: cnnResult.prediction,
          aiConfidence: cnnResult.confidence,
          userContext: args.question || "Uploaded for diagnosis.",
          imagePath: args.originalName 
        });
        lowConfidenceWarning += " An expert has been notified to review your plant.";
      } catch (escErr) {
        console.error("Failed to request expert review:", escErr);
      }
    }

    // [CRITICAL FIX] HARD ABORT ON LOW CONFIDENCE
    let abortMessage = "";
    const isArabic = /[\\u0600-\\u06FF]/.test(args.question || "") || args.language === "ar";
    abortMessage = isArabic
      ? "عذرًا، لم نتمكن من تحديد حالة النبات بثقة من هذه الصورة. يرجى رفع صورة أوضح للأوراق أو الأجزاء المصابة."
      : "We couldn't confidently identify the condition from this image. Please upload a clearer photo showing the affected leaves.";

    let communityDraft: any = null;
    if (args.userId && args.originalName) {
      try {
        const formattedDisease = cnnResult.prediction.replace(/___/g, " - ").replace(/_/g, " ");
        const langInstruction = isArabic ? "CRITICAL: You MUST write the title and content in Arabic." : "You MUST write the title and content in the user's language.";
        const draftPrompt = `You are a helpful plant expert assistant. The user uploaded an image of a plant that our AI diagnosed as "${formattedDisease}" with only ${(conf * 100).toFixed(0)}% confidence. This is too low to be certain.
Please generate a draft for a community post so the user can ask human experts for help.
${langInstruction}
Output valid JSON in this exact format:
{
  "title": "Short descriptive title",
  "content": "Detailed description explaining that the AI suggested ${formattedDisease} but wasn't sure, and asking the community for their opinion."
}`;
        const draftRes = await askLlm(settings, draftPrompt, "llm", [], "search");
        const cleanedMessage = sanitizeModelOutput(draftRes.message);
        communityDraft = JSON.parse(cleanedMessage.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch (draftErr) {
        console.warn("Failed to generate community draft on low confidence:", draftErr);
      }
    }

    await logAiCall({
      userId: args.userId,
      requestId: reqId,
      feature: "image_chat",
      provider: "cnn",
      status: "success",
      latencyMs: Date.now() - started,
      inputMeta: { mode: "image_chat_aborted" },
    });

    return {
      mode: "diagnosis" as const,
      diagnosis: cnnResult,
      message: abortMessage,
      source: "cnn",
      provider: cnnResult.provider,
      providerChain: ["cnn"],
      lowConfidenceWarning: "Diagnosis rejected due to low confidence.",
      communityDraft
    } as any;
  }

  const shouldGenerateAnswer = !args.skipAdvice && (Boolean(question) || settings.pipeline.answerAfterDiagnosis);

  let message = "";
  let source: "rag" | "llm" | "fallback" | "cnn" | "hf-rag-fallback" = "cnn";
  let provider = cnnResult?.provider || "cnn";
  let ragContext: string | undefined;
  let communityContext: string | undefined;
  let kbAdvice: string | undefined;
  let kbSeverity: string | undefined;
  let toolCalls: any[] | undefined;
  let communityContextObj: any = undefined;

  if (shouldGenerateAnswer) {
    // ── RAG Stage: Pure Knowledge Retrieval ──────────────────────────────────
    let ragRetrievedContext: string | undefined;
    if (settings.rag.enabled && settings.rag.endpointUrl && cnnResult?.prediction) {
      let optimizedQuery = question || cnnResult.prediction.replace(/_/g, " ");

      try {
        const ragResult = await retrieveRagChunks(
          settings,
          predictedDisease,
          args.question || "",
          args.topK,
          args.language,
          predictedCrop
        );
        ragRetrievedContext = ragResult.contextText;
        ragContext = ragRetrievedContext;
        console.log(`[RAG_SUCCESS] ${ragResult.chunks.length} chunks for "${predictedDisease}" (crop: ${predictedCrop})`);
        providerChain.push("rag");
      } catch (ragError) {
        console.warn(
          "[RAG_FAILED] RAG /retrieve failed, proceeding without context:",
          sanitizeErrorMessage(ragError)
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (cnnResult?.prediction) {
       try {
         const { DiseaseKnowledgeRecord } = await import("../../models/disease_knowledge_record_model");
         const kbRecord = await DiseaseKnowledgeRecord.findOne({
            $or: [
              { diseaseNameEn: cnnResult.prediction },
              { diseaseNameEn: cnnResult.prediction.replace(/_/g, " ") }
            ]
         }).lean();
         kbAdvice = kbRecord?.advice;
         kbSeverity = kbRecord?.severity;
       } catch (err) {
         console.warn("KB lookup failed in orchestrator:", sanitizeErrorMessage(err));
       }
    }

    try {
      const commResult = await retrieveCommunityContext(cnnResult?.prediction, question);
      if (commResult.hasData) {
        communityContext = commResult.text;
        communityContextObj = { text: commResult.text, meta: commResult.meta };
      }
    } catch (error) {
      console.warn("Community context retrieval failed for image chat:", sanitizeErrorMessage(error));
    }

    const prompt = buildAssistantPrompt({
      userQuestion: question || "Explain diagnosis and safe care guidance for this plant.",
      history: sanitizedHistory,
      cnn: cnnResult
        ? {
            prediction: cnnResult.prediction,
            confidence: cnnResult.confidence,
            candidates: cnnResult.candidates,
          }
        : undefined,
      kbAdvice,
      kbSeverity,
      lowConfidenceWarning:
        settings.pipeline.lowConfidenceBehavior === "warn" || settings.pipeline.lowConfidenceBehavior === "ask_for_new_image"
          ? lowConfidenceWarning
          : "",
      ragContext: ragRetrievedContext,
      communityContext,
      language: args.language,
    });

    let chatResult: { message: string, source: "llm"|"fallback"|"rag"|"cnn"|"hf-rag-fallback", provider: string, toolCalls?: any[] };
    // askLlm handles all internal failures and returns a safe fallback
    // object for taskRole "chat" — it never throws. No try/catch needed.
    console.log("[RUNTIME_TRACE] BEFORE LLM CALL");
    console.log("[RUNTIME_TRACE] LLM REQUEST PROMPT LENGTH:", prompt.length);
    
    if (args.userId && settings.llm.enabled && !args.skipAdvice) {
       console.log("[AGENT] Fast-tracking LLM call for Diagnosis (Agent loop bypassed for speed)");
       chatResult = await askLlm(settings, prompt, "llm", sanitizedHistory);
       
       // Asynchronously add the detected plant to the user's garden without blocking the response
       const targetPlantName = predictedCrop || predictedDisease.replace(/_/g, " ").split(" ")[0];
       if (targetPlantName && args.userId) {
         (async () => {
           try {
             const { AgentToolRegistry } = await import("./agent_tool_registry");
             const registry = new AgentToolRegistry();
             await registry.executeTool("add_plant_to_garden", { plantName: targetPlantName, imageUrl: args.originalName }, args.userId!, undefined, settings);
             console.log("[BACKGROUND] Successfully added diagnosed plant to garden asynchronously.");
           } catch (e) {
             console.log("[BACKGROUND] Failed to auto-add plant to garden:", e);
           }
         })();
       }
    } else {
       chatResult = await askLlm(settings, prompt, "llm", sanitizedHistory);
    }
    
    console.log("[RUNTIME_TRACE] AFTER LLM CALL");
    console.log("[RUNTIME_TRACE] LLM RESPONSE CHAT RESULT:", JSON.stringify(chatResult));

    if (chatResult.source === "fallback") {
      console.warn("[LLM] All providers failed, using static fallback.");
    } else {
      console.log(`[LLM] Response from: ${chatResult.provider}`);
    }
    
    // Cascade logic
    if (chatResult.source === "fallback") {
       const isArabic = /[\\u0600-\\u06FF]/.test(args.question || "") || args.language === "ar";
       if (cnnResult) {
           console.log("[FINAL_RESPONSE_SOURCE] cnn");
           const confStr = typeof cnnResult.confidence === "number" ? (cnnResult.confidence * 100).toFixed(2) + "%" : "Unknown";
           
           let cnnMessage = isArabic 
              ? `المرض المكتشف: **${cnnResult.prediction.replace(/_/g, " ")}**\n\nنسبة الثقة: ${confStr}\n`
              : `Disease Detected: **${cnnResult.prediction.replace(/_/g, " ")}**\n\nConfidence: ${confStr}\n`;
              
           if (kbSeverity) {
              cnnMessage += isArabic ? `الخطورة: ${kbSeverity}\n` : `Severity: ${kbSeverity}\n`;
           }
           if (kbAdvice) {
              cnnMessage += isArabic ? `\nالإجراءات الموصى بها:\n${kbAdvice}` : `\nRecommended Actions:\n${kbAdvice}`;
           } else {
              cnnMessage += isArabic 
                 ? `\nيرجى مراقبة نباتك بعناية وتوفير ظروف الري والضوء المناسبة.` 
                 : `\nPlease monitor your plant carefully and ensure proper watering and light conditions.`;
           }
           chatResult = { message: cnnMessage, source: "cnn", provider: cnnResult.provider || "cnn" };
       } else {
           console.log("[FINAL_RESPONSE_SOURCE] fallback");
           chatResult.message = isArabic 
              ? "أواجه حاليًا ضغطًا كبيرًا ولا يمكنني إنشاء رد مفصل. يرجى المحاولة مرة أخرى لاحقًا."
              : "I am currently experiencing high traffic and cannot generate a detailed response. Please try again later.";
       }
    } else {
       console.log(`[FINAL_RESPONSE_SOURCE] ${chatResult.source}`);
    }

    providerChain.push(chatResult.provider);
    message = sanitizeLlmResponse(chatResult.message);
    source = chatResult.source;
    provider = chatResult.provider;
    toolCalls = chatResult.toolCalls;
  }

  if (!message) {
    const isArabic = /[\\u0600-\\u06FF]/.test(args.question || "") || args.language === "ar";
    message = isArabic 
      ? "أواجه حاليًا ضغطًا كبيرًا ولا يمكنني إنشاء رد مفصل. يرجى المحاولة مرة أخرى لاحقًا."
      : "I am currently experiencing high traffic and cannot generate a detailed response. Please try again later.";
    source = "fallback";
  }

  if (isLowConfidence && settings.pipeline.lowConfidenceBehavior === "ask_for_new_image") {
    const isArabic = /[\\u0600-\\u06FF]/.test(args.question || "") || args.language === "ar";
    const suffix = isArabic 
       ? "يرجى رفع صورة أوضح للنبات للحصول على تحليل أكثر دقة."
       : "Please upload a clearer image of the plant for a more accurate analysis.";
    if (message) {
      if (!message.endsWith(suffix)) {
        message += `\n\n${suffix}`;
      }
    } else {
      message = suffix;
    }
  }

  await logAiCall({
    userId: args.userId,
    requestId: reqId,
    feature: hasFile ? "image_chat" : "chat",
    provider,
    sourceIds: providerChain,
    status: "success",
    latencyMs: Date.now() - started,
    inputMeta: {
      mode: hasFile ? "image_chat" : "chat",
      providerChain,
      historyCount: args.history.length,
      questionLength: question.length,
    },
    outputMeta: {
      confidence: cnnResult?.confidence,
      responseLength: message?.length || 0,
      source,
      ragContextLength: ragContext?.length || 0,
    },
  });

  let gardenExtraction: any = undefined;
  if (message && message.includes("```json")) {
    try {
      const match = message.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (parsed.gardenExtraction) {
          gardenExtraction = parsed.gardenExtraction;
          // Clean the message by removing the extraction block
          message = message.replace(/```json\s*\{[\s\S]*?\}\s*```/g, "").trim();
        }
      }
    } catch (e) {
      console.warn("Failed to parse gardenExtraction from message", e);
    }
  }

  const responsePayload = {
    mode: hasFile ? ("image_chat" as const) : ("chat" as const),
    diagnosis: cnnResult
      ? {
          prediction: cnnResult.prediction,
          confidence: cnnResult.confidence,
          candidates: cnnResult.candidates || [],
          provider: cnnResult.provider,
        }
      : undefined,
    message,
    source,
    provider,
    lowConfidenceWarning: isLowConfidence ? lowConfidenceWarning : "",
    needsNewImage: isLowConfidence && (settings.pipeline.lowConfidenceBehavior === "block" || settings.pipeline.lowConfidenceBehavior === "ask_for_new_image"),
    recommendedAction: !isLowConfidence
      ? undefined
      : settings.pipeline.lowConfidenceBehavior === "warn"
      ? "review_with_caution"
      : "upload_clearer_image",
    providerChain,
    ragContext,
    communityContext: communityContextObj,
    kbAdvice,
    kbSeverity,
    toolCalls,
    gardenExtraction,
  };

  try {
    const { evaluateRecommendation } = await import("./decision_engine");
    // ✅ FIX: Check real expert availability from DB instead of hardcoding true
    const expertCount = await (await import("../../models/user_model")).default
      .countDocuments({ role: "expert" })
      .catch(() => 0);
    const decisionResult = evaluateRecommendation({
      confidence: cnnResult?.confidence,
      diseaseName: cnnResult?.prediction,
      isAmbiguous: responsePayload.lowConfidenceWarning !== "",
      historyLength: args.history.length,
      userQuestion: question,
      expertAvailable: expertCount > 0,
    });
    
    // Only recommend if not a simple fallback and we have an actual recommendation
    if (decisionResult.recommendation !== "none" && args.history.length <= 5) {
      responsePayload.recommendedAction = decisionResult.recommendation;
      // We can also attach the reason or score if needed
    }
  } catch (err) {
    console.error("Decision engine failed:", err);
  }

  return responsePayload;
};



