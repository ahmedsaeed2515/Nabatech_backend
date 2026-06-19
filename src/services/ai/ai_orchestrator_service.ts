import FormData from "form-data";
import AiCallLog from "../../models/ai_call_log_model";
import { askLlm } from "./llm_provider";
import { askRag, retrieveRagChunks } from "./rag_provider";
import { runCnnDiagnosis } from "./cnn_provider";
import { getAiSettings } from "./ai_config_service";
import { sanitizeErrorMessage } from "./ai_errors";
import { buildAssistantPrompt, extractRagQuery } from "./assistant_prompt_builder";
import { retrieveCommunityContext } from "./community_knowledge_retriever";
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
      console.log("[RAG_SUCCESS]");
    } catch (error) {
      console.warn("[RAG_FAILED] RAG retrieval failed for text chat:", sanitizeErrorMessage(error));
    }
  }

  let communityContext: string | undefined;
  try {
    const commResult = await retrieveCommunityContext(undefined, args.question);
    if (commResult.hasData) {
      communityContext = commResult.text;
    }
  } catch (error) {
    console.warn("Community context retrieval failed for text chat:", sanitizeErrorMessage(error));
  }

  const prompt = buildAssistantPrompt({
    userQuestion: args.question,
    history: sanitizedHistory,
    ragContext,
    communityContext,
  });

  let chatResult: { message: string, source: "llm"|"fallback"|"rag", provider: string };
  try {
    chatResult = await askLlm(settings, prompt, "llm", sanitizedHistory);
    if (chatResult.source !== "fallback") {
      console.log("[LLM_SUCCESS]");
    } else {
      console.warn("[LLM_FAILED] Primary LLM returned safe fallback");
    }
  } catch (llmError) {
    console.warn("[LLM_FAILED] Primary LLM threw an error:", sanitizeErrorMessage(llmError));
    chatResult = { message: "I am currently experiencing high traffic and unable to generate a detailed AI response. Please rely on the standard offline advice provided for your plant's care.", source: "fallback", provider: "local_fallback" };
    if (settings.features.allowBackendFallbackToLLM) {
      try {
        const fallbackLlm = await askLlm(settings, prompt, "fallback", sanitizedHistory);
        if (fallbackLlm.source !== "fallback") {
          console.log("[LLM_SUCCESS] Backend fallback LLM succeeded");
          chatResult = fallbackLlm;
        } else {
          console.warn("[LLM_FAILED] Backend fallback LLM returned safe fallback");
        }
      } catch (fallbackError) {
        console.warn("[LLM_FAILED] Backend fallback LLM threw an error");
      }
    }
  }

  // Cascade logic
  if (chatResult.source === "fallback") {
    if (ragContext) {
      console.log("[FINAL_RESPONSE_SOURCE] rag");
      chatResult = { message: ragContext, source: "rag", provider: "rag" };
    } else {
      console.log("[FINAL_RESPONSE_SOURCE] fallback");
    }
  } else {
    console.log("[FINAL_RESPONSE_SOURCE] llm");
  }

  await logAiCall({
    userId: args.userId,
    requestId: reqId,
    feature: "chat",
    provider: chatResult.provider,
    status: chatResult.source === "fallback" ? "failure" : "success",
    latencyMs: Date.now() - started,
    inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
    outputMeta: { responseLength: chatResult.message.length, source: chatResult.source },
    errorMessage: chatResult.source === "fallback" ? "No AI provider succeeded" : undefined,
  });

  return { ...chatResult, ragContext, communityContext };
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
  let communityContext: string | undefined;
  let kbAdvice: string | undefined;
  let kbSeverity: string | undefined;

  if (isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block") {
    message = "The image confidence is too low. Please upload a clearer image of the plant to receive advice.";
  } else if (shouldGenerateAnswer) {
    // ── RAG Stage: Pure Knowledge Retrieval ──────────────────────────────────
    let ragRetrievedContext: string | undefined;
    if (settings.rag.enabled && settings.rag.endpointUrl && cnnResult?.prediction) {
      try {
        const ragResult = await retrieveRagChunks(
          settings,
          cnnResult.prediction,
          question,
          args.topK,
        );
        ragRetrievedContext = ragResult.contextText;
        ragContext = ragRetrievedContext;
        console.log(`[RAG_SUCCESS] ${ragResult.chunks.length} chunks for "${cnnResult.prediction}"`);
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
         });
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
    });

    let chatResult: { message: string, source: "llm"|"fallback"|"rag"|"cnn", provider: string };
    try {
      chatResult = await askLlm(settings, prompt, "llm", sanitizedHistory);
      if (chatResult.source !== "fallback") {
        console.log("[LLM_SUCCESS]");
      } else {
        console.warn("[LLM_FAILED] Primary LLM returned safe fallback");
      }
    } catch (llmError) {
       console.warn("[LLM_FAILED] Primary LLM threw an error:", sanitizeErrorMessage(llmError));
       chatResult = { message: "I am currently experiencing high traffic and unable to generate a detailed AI response. Please rely on the standard offline advice provided for your plant's care.", source: "fallback", provider: "local_fallback" };
       if (settings.features.allowBackendFallbackToLLM) {
          try {
             const fallbackLlm = await askLlm(settings, prompt, "fallback", sanitizedHistory);
             if (fallbackLlm.source !== "fallback") {
                 console.log("[LLM_SUCCESS] Backend fallback LLM succeeded");
                 chatResult = fallbackLlm;
             } else {
                 console.warn("[LLM_FAILED] Backend fallback LLM returned safe fallback");
             }
          } catch (fallbackError) {
             console.warn("[LLM_FAILED] Backend fallback LLM threw an error");
          }
       }
    }
    
    // Cascade logic
    if (chatResult.source === "fallback") {
       if (ragContext) {
           console.log("[FINAL_RESPONSE_SOURCE] rag");
           chatResult = { message: ragContext, source: "rag", provider: "rag" };
       } else if (cnnResult) {
           console.log("[FINAL_RESPONSE_SOURCE] cnn");
           const confStr = typeof cnnResult.confidence === "number" ? (cnnResult.confidence * 100).toFixed(2) + "%" : "Unknown";
           let cnnMessage = `Disease Detected: **${cnnResult.prediction.replace(/_/g, " ")}**\n\nConfidence: ${confStr}\n`;
           if (kbSeverity) cnnMessage += `Severity: ${kbSeverity}\n`;
           if (kbAdvice) {
              cnnMessage += `\nRecommended Actions:\n${kbAdvice}`;
           } else {
              cnnMessage += `\nPlease monitor your plant carefully and ensure proper watering and light conditions.`;
           }
           chatResult = { message: cnnMessage, source: "cnn", provider: cnnResult.provider || "cnn" };
       } else {
           console.log("[FINAL_RESPONSE_SOURCE] fallback");
       }
    } else {
       console.log("[FINAL_RESPONSE_SOURCE] llm");
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
    communityContext,
    kbAdvice,
    kbSeverity,
  };

  try {
    const { evaluateRecommendation } = await import("./decision_engine");
    const decisionResult = evaluateRecommendation({
      confidence: cnnResult?.confidence,
      diseaseName: cnnResult?.prediction,
      isAmbiguous: responsePayload.lowConfidenceWarning !== "",
      historyLength: args.history.length,
      userQuestion: question,
      expertAvailable: true, // simplified for now
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

