import FormData from "form-data";
import AiCallLog from "../../models/ai_call_log_model";
import { askLlm } from "./llm_provider";
import { askRag } from "./rag_provider";
import { runCnnDiagnosis } from "./cnn_provider";
import { getAiSettings } from "./ai_config_service";
import { sanitizeErrorMessage } from "./ai_errors";
import { buildAssistantPrompt, extractRagQuery } from "./assistant_prompt_builder";
import crypto from "crypto";

const logAiCall = async (payload: {
  userId?: string;
  requestId?: string;
  feature: "diagnosis" | "chat" | "image_chat";
  provider: string;
  model?: string;
  sourceIds?: string[];
  status: "success" | "failure";
  latencyMs: number;
  inputMeta?: Record<string, unknown>;
  outputMeta?: Record<string, unknown>;
  errorMessage?: string;
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
}) => {
  const settings = await getAiSettings();
  const started = Date.now();
  const reqId = args.requestId || crypto.randomUUID();
  const sanitizedHistory = args.history.filter(msg => msg.role !== "system");
  
  let ragContext: string | undefined;
  if (settings.rag.enabled && settings.rag.endpointUrl) {
    try {
      const ragQuery = extractRagQuery(args.question);
      const rag = await askRag(settings, ragQuery, sanitizedHistory, args.topK);
      ragContext = rag.message;
    } catch (error) {
      console.warn("RAG retrieval failed for text chat:", sanitizeErrorMessage(error));
    }
  }

  const prompt = buildAssistantPrompt({
    userQuestion: args.question,
    history: sanitizedHistory,
    ragContext,
  });

  let lastError: unknown;
  try {
    const llm = await askLlm(settings, prompt, "llm", sanitizedHistory);
    await logAiCall({
      userId: args.userId,
      requestId: reqId,
      feature: "chat",
      provider: llm.provider,
      status: "success",
      latencyMs: Date.now() - started,
      inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
      outputMeta: { responseLength: llm.message?.length || 0, source: llm.source },
    });
    return { ...llm, ragContext };
  } catch (error) {
    lastError = error;
  }

  if (settings.features.allowBackendFallbackToLLM) {
    try {
      const llm = await askLlm(settings, prompt, "fallback", sanitizedHistory);
      await logAiCall({
        userId: args.userId,
        requestId: reqId,
        feature: "chat",
        provider: llm.provider,
        status: "success",
        latencyMs: Date.now() - started,
        inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
        outputMeta: { responseLength: llm.message?.length || 0, source: llm.source },
      });
      return { ...llm, ragContext };
    } catch (error) {
      lastError = error;
    }
  }

  await logAiCall({
    userId: args.userId,
    requestId: reqId,
    feature: "chat",
    provider: "none",
    status: "failure",
    latencyMs: Date.now() - started,
    inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
    errorMessage: sanitizeErrorMessage(lastError),
  });

  throw lastError instanceof Error ? lastError : new Error("No AI provider succeeded");
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
    const chat = await orchestrateChat({ userId: args.userId, requestId: reqId, question, history: sanitizedHistory, topK: args.topK });
    return { mode: "chat" as const, message: chat.message, source: chat.source, provider: chat.provider, providerChain: [chat.provider], ragContext: chat.ragContext };
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
      providerChain.push("cnn");
    } catch (error) {
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

  if (isLowConfidence && cnnResult) {
    const conf = typeof cnnResult.confidence === "number" ? cnnResult.confidence : 0;
    lowConfidenceWarning = `Low CNN confidence (${conf.toFixed(3)}) below threshold (${settings.cnn.confidenceThreshold.toFixed(3)}).`;
  }

  const shouldGenerateAnswer =
    !args.skipAdvice &&
    (Boolean(question) || settings.pipeline.answerAfterDiagnosis) &&
    !(isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block");

  let message = "";
  let source: "rag" | "llm" | "fallback" | "cnn" = "cnn";
  let provider = cnnResult?.provider || "cnn";
  let ragContext: string | undefined;
  let kbAdvice: string | undefined;
  let kbSeverity: string | undefined;

  if (isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block") {
    message = "The image confidence is too low. Please upload a clearer image of the plant to receive advice.";
  } else if (shouldGenerateAnswer) {
    const ragQuery = extractRagQuery(question || (cnnResult?.prediction ? `${cnnResult.prediction} plant disease treatment` : "plant disease diagnosis"));

    let ragRetrievedContext: string | undefined;
    if (settings.rag.enabled && settings.rag.endpointUrl) {
      try {
        const ragResult = await askRag(settings, ragQuery, [], args.topK);
        ragRetrievedContext = ragResult.message;
        ragContext = ragRetrievedContext;
      } catch (ragError) {
        console.warn("RAG retrieval failed for image chat, proceeding without context:", sanitizeErrorMessage(ragError));
      }
    }

    if (cnnResult?.prediction) {
       try {
         const { DiseaseKnowledgeRecord } = await import("../../models/disease_knowledge_record_model");
         const kbRecord = await DiseaseKnowledgeRecord.findOne({
            $or: [
              { diseaseNameEn: cnnResult.prediction },
              { diseaseNameEn: cnnResult.prediction.replace(/_/g, " ") }
            ]
         });
         kbAdvice = kbRecord?.advice;
         kbSeverity = kbRecord?.severity;
       } catch (err) {
         console.warn("KB lookup failed in orchestrator:", sanitizeErrorMessage(err));
       }
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
    });

    let chatResult: { message: string, source: "llm"|"fallback", provider: string };
    try {
      chatResult = await askLlm(settings, prompt, "llm", sanitizedHistory);
    } catch (llmError) {
       if (settings.features.allowBackendFallbackToLLM) {
          try {
             chatResult = await askLlm(settings, prompt, "fallback", sanitizedHistory);
          } catch (fallbackError) {
             throw fallbackError;
          }
       } else {
          throw llmError;
       }
    }
    
    providerChain.push(chatResult.provider);
    message = chatResult.message;
    source = chatResult.source;
    provider = chatResult.provider;
  }

  if (isLowConfidence && settings.pipeline.lowConfidenceBehavior === "ask_for_new_image") {
    const suffix = "Please upload a clearer image of the plant for a more accurate analysis.";
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

  return {
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
    kbAdvice,
    kbSeverity,
  };
};
