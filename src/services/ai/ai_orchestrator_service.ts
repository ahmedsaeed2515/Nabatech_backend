import FormData from "form-data";
import AiCallLog from "../../models/ai_call_log_model";
import { askLlm } from "./llm_provider";
import { askRag } from "./rag_provider";
import { runCnnDiagnosis } from "./cnn_provider";
import { getAiSettings } from "./ai_config_service";
import { sanitizeErrorMessage } from "./ai_errors";
import { buildAssistantPrompt } from "./assistant_prompt_builder";

const logAiCall = async (payload: {
  userId?: string;
  feature: "diagnosis" | "chat" | "image_chat";
  provider: string;
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

export const orchestrateDiagnosis = async (args: {
  userId?: string;
  fileBuffer: Buffer;
  originalName: string;
}) => {
  const started = Date.now();
  const settings = await getAiSettings();

  const formData = new FormData();
  formData.append("file", args.fileBuffer, { filename: args.originalName || "image.jpg" });

  try {
    const result = await runCnnDiagnosis(settings, formData, formData.getHeaders() as Record<string, string>);
    await logAiCall({
      userId: args.userId,
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
  question: string;
  history: Array<{ role: string; content: string }>;
  topK?: number;
}) => {
  const settings = await getAiSettings();
  const started = Date.now();
  let lastError: unknown;

  for (const source of settings.fallback.chatOrder) {
    try {
      if (source === "rag") {
        const rag = await askRag(settings, args.question, args.history, args.topK);
        await logAiCall({
          userId: args.userId,
          feature: "chat",
          provider: rag.provider,
          status: "success",
          latencyMs: Date.now() - started,
          inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
          outputMeta: { responseLength: rag.message.length, source: rag.source },
        });
        return rag;
      }

      if (source === "llm") {
        const llmSource = settings.rag.enabled ? "fallback" : "llm";
        const llm = await askLlm(settings, args.question, llmSource);
        await logAiCall({
          userId: args.userId,
          feature: "chat",
          provider: llm.provider,
          status: "success",
          latencyMs: Date.now() - started,
          inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
          outputMeta: { responseLength: llm.message.length, source: llm.source },
        });
        return llm;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (settings.features.allowBackendFallbackToLLM) {
    try {
      const llm = await askLlm(settings, args.question, "fallback");
      await logAiCall({
        userId: args.userId,
        feature: "chat",
        provider: llm.provider,
        status: "success",
        latencyMs: Date.now() - started,
        inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
        outputMeta: { responseLength: llm.message.length, source: llm.source },
      });
      return llm;
    } catch (error) {
      lastError = error;
    }
  }

  await logAiCall({
    userId: args.userId,
    feature: "chat",
    provider: "none",
    status: "failure",
    latencyMs: Date.now() - started,
    inputMeta: { questionLength: args.question.length, historyCount: args.history.length },
    errorMessage: sanitizeErrorMessage(lastError),
  });

  throw lastError instanceof Error ? lastError : new Error("No AI provider succeeded");
};

const runChatWithQuestion = async (args: {
  settings: Awaited<ReturnType<typeof getAiSettings>>;
  question: string;
  history: Array<{ role: string; content: string }>;
  topK?: number;
}) => {
  let lastError: unknown;
  for (const source of args.settings.fallback.chatOrder) {
    try {
      if (source === "rag") {
        return await askRag(args.settings, args.question, args.history, args.topK);
      }
      if (source === "llm") {
        const llmSource = args.settings.rag.enabled ? "fallback" : "llm";
        return await askLlm(args.settings, args.question, llmSource);
      }
    } catch (error) {
      lastError = error;
    }
  }
  if (args.settings.features.allowBackendFallbackToLLM) {
    return await askLlm(args.settings, args.question, "fallback");
  }
  throw lastError instanceof Error ? lastError : new Error("No AI provider succeeded");
};

export const orchestrateAssistantRequest = async (args: {
  userId?: string;
  fileBuffer?: Buffer;
  originalName?: string;
  question?: string;
  history: Array<{ role: string; content: string }>;
  topK?: number;
}) => {
  const settings = await getAiSettings();
  const started = Date.now();
  const question = (args.question || "").trim();
  const hasFile = Boolean(args.fileBuffer && args.fileBuffer.length);

  if (!hasFile && !question) {
    throw new Error("Either file or question is required");
  }

  if (!hasFile && question) {
    const chat = await orchestrateChat({ userId: args.userId, question, history: args.history, topK: args.topK });
    return { mode: "chat" as const, message: chat.message, source: chat.source, provider: chat.provider };
  }

  const providerChain: string[] = [];
  let cnnResult: Awaited<ReturnType<typeof runCnnDiagnosis>> | null = null;
  let lowConfidenceWarning = "";

  if (settings.pipeline.imageFirst) {
    try {
      const formData = new FormData();
      formData.append("file", args.fileBuffer!, { filename: args.originalName || "image.jpg" });
      cnnResult = await runCnnDiagnosis(settings, formData, formData.getHeaders() as Record<string, string>);
      providerChain.push("cnn");
    } catch (error) {
      if (!settings.pipeline.allowAnswerIfCnnFails) {
        await logAiCall({
          userId: args.userId,
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
    (Boolean(question) || settings.pipeline.answerAfterDiagnosis) &&
    !(isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block");

  let message = "";
  let source: "rag" | "llm" | "fallback" | "cnn" = "cnn";
  let provider = cnnResult?.provider || "cnn";

  if (isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block") {
    message = "The image confidence is too low. Please upload a clearer image of the plant to receive advice.";
  } else if (shouldGenerateAnswer) {
    const prompt = buildAssistantPrompt({
      userQuestion: question || "Explain diagnosis and safe care guidance for this plant.",
      history: args.history,
      cnn: cnnResult
        ? {
            prediction: cnnResult.prediction,
            confidence: cnnResult.confidence,
            candidates: cnnResult.candidates,
          }
        : undefined,
      lowConfidenceWarning:
        settings.pipeline.lowConfidenceBehavior === "warn" || settings.pipeline.lowConfidenceBehavior === "ask_for_new_image"
          ? lowConfidenceWarning
          : "",
    });

    const chat = await runChatWithQuestion({
      settings,
      question: prompt,
      history: args.history,
      topK: args.topK,
    });
    providerChain.push(chat.provider);
    message = chat.message;
    source = chat.source;
    provider = chat.provider;
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
    feature: hasFile ? "image_chat" : "chat",
    provider,
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
      responseLength: message.length,
      source,
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
  };
};
