"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrateAssistantRequest = exports.orchestrateChat = exports.orchestrateDiagnosis = void 0;
const form_data_1 = __importDefault(require("form-data"));
const ai_call_log_model_1 = __importDefault(require("../../models/ai_call_log_model"));
const llm_provider_1 = require("./llm_provider");
const rag_provider_1 = require("./rag_provider");
const cnn_provider_1 = require("./cnn_provider");
const ai_config_service_1 = require("./ai_config_service");
const ai_errors_1 = require("./ai_errors");
const assistant_prompt_builder_1 = require("./assistant_prompt_builder");
const community_knowledge_retriever_1 = require("./community_knowledge_retriever");
const crypto_1 = __importDefault(require("crypto"));
const logAiCall = async (payload) => {
    try {
        await ai_call_log_model_1.default.create(payload);
    }
    catch (error) {
        console.warn("AI call logging failed:", (0, ai_errors_1.sanitizeErrorMessage)(error));
    }
};
const validateProviderOutput = (result) => {
    if (result && typeof result.confidence === "number") {
        if (result.confidence < 0)
            result.confidence = 0;
        if (result.confidence > 1)
            result.confidence = 1;
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
const orchestrateDiagnosis = async (args) => {
    const started = Date.now();
    const settings = await (0, ai_config_service_1.getAiSettings)();
    const reqId = args.requestId || crypto_1.default.randomUUID();
    const formData = new form_data_1.default();
    formData.append("file", args.fileBuffer, { filename: args.originalName || "image.jpg" });
    try {
        const rawResult = await (0, cnn_provider_1.runCnnDiagnosis)(settings, formData, formData.getHeaders());
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
    }
    catch (error) {
        await logAiCall({
            userId: args.userId,
            requestId: reqId,
            feature: "diagnosis",
            provider: settings.cnn.provider,
            status: "failure",
            latencyMs: Date.now() - started,
            inputMeta: { filename: args.originalName, bytes: args.fileBuffer.length },
            errorMessage: (0, ai_errors_1.sanitizeErrorMessage)(error),
        });
        throw error;
    }
};
exports.orchestrateDiagnosis = orchestrateDiagnosis;
const orchestrateChat = async (args) => {
    const settings = await (0, ai_config_service_1.getAiSettings)();
    const started = Date.now();
    const reqId = args.requestId || crypto_1.default.randomUUID();
    const sanitizedHistory = args.history.filter(msg => msg.role !== "system");
    let ragContext;
    if (settings.rag.enabled && settings.rag.endpointUrl) {
        try {
            const ragQuery = (0, assistant_prompt_builder_1.extractRagQuery)(args.question);
            const rag = await (0, rag_provider_1.askRag)(settings, ragQuery, sanitizedHistory, args.topK);
            ragContext = rag.message;
        }
        catch (error) {
            console.warn("RAG retrieval failed for text chat:", (0, ai_errors_1.sanitizeErrorMessage)(error));
        }
    }
    let communityContext;
    try {
        const commResult = await (0, community_knowledge_retriever_1.retrieveCommunityContext)(undefined, args.question);
        if (commResult.hasData) {
            communityContext = commResult.text;
        }
    }
    catch (error) {
        console.warn("Community context retrieval failed for text chat:", (0, ai_errors_1.sanitizeErrorMessage)(error));
    }
    const prompt = (0, assistant_prompt_builder_1.buildAssistantPrompt)({
        userQuestion: args.question,
        history: sanitizedHistory,
        ragContext,
        communityContext,
    });
    let lastError;
    try {
        const llm = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory);
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
        return { ...llm, ragContext, communityContext };
    }
    catch (error) {
        lastError = error;
    }
    if (settings.features.allowBackendFallbackToLLM) {
        try {
            const llm = await (0, llm_provider_1.askLlm)(settings, prompt, "fallback", sanitizedHistory);
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
            return { ...llm, ragContext, communityContext };
        }
        catch (error) {
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
        errorMessage: (0, ai_errors_1.sanitizeErrorMessage)(lastError),
    });
    throw lastError instanceof Error ? lastError : new Error("No AI provider succeeded");
};
exports.orchestrateChat = orchestrateChat;
const orchestrateAssistantRequest = async (args) => {
    const settings = await (0, ai_config_service_1.getAiSettings)();
    const started = Date.now();
    const reqId = args.requestId || crypto_1.default.randomUUID();
    const question = (args.question || "").trim();
    const hasFile = Boolean(args.fileBuffer && args.fileBuffer.length);
    const sanitizedHistory = args.history.filter(msg => msg.role !== "system");
    if (!hasFile && !question) {
        throw new Error("Either file or question is required");
    }
    if (!hasFile && question) {
        const chat = await (0, exports.orchestrateChat)({ userId: args.userId, requestId: reqId, question, history: sanitizedHistory, topK: args.topK });
        return { mode: "chat", message: chat.message, source: chat.source, provider: chat.provider, providerChain: [chat.provider], ragContext: chat.ragContext, communityContext: chat.communityContext };
    }
    const providerChain = [];
    let cnnResult = null;
    let lowConfidenceWarning = "";
    if (settings.pipeline.imageFirst) {
        try {
            const formData = new form_data_1.default();
            formData.append("file", args.fileBuffer, { filename: args.originalName || "image.jpg" });
            const rawCnn = await (0, cnn_provider_1.runCnnDiagnosis)(settings, formData, formData.getHeaders());
            cnnResult = validateProviderOutput(rawCnn);
            providerChain.push("cnn");
        }
        catch (error) {
            if (!settings.pipeline.allowAnswerIfCnnFails) {
                await logAiCall({
                    userId: args.userId,
                    requestId: reqId,
                    feature: "image_chat",
                    provider: "cnn",
                    status: "failure",
                    latencyMs: Date.now() - started,
                    inputMeta: { mode: "image_chat", providerChain: ["cnn"], historyCount: args.history.length },
                    errorMessage: (0, ai_errors_1.sanitizeErrorMessage)(error),
                });
                throw error;
            }
        }
    }
    const isLowConfidence = Boolean(cnnResult &&
        typeof cnnResult.confidence === "number" &&
        cnnResult.confidence < settings.cnn.confidenceThreshold);
    if (isLowConfidence && cnnResult) {
        const conf = typeof cnnResult.confidence === "number" ? cnnResult.confidence : 0;
        lowConfidenceWarning = `Low CNN confidence (${conf.toFixed(3)}) below threshold (${settings.cnn.confidenceThreshold.toFixed(3)}).`;
    }
    const shouldGenerateAnswer = !args.skipAdvice &&
        (Boolean(question) || settings.pipeline.answerAfterDiagnosis) &&
        !(isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block");
    let message = "";
    let source = "cnn";
    let provider = cnnResult?.provider || "cnn";
    let ragContext;
    let communityContext;
    let kbAdvice;
    let kbSeverity;
    if (isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block") {
        message = "The image confidence is too low. Please upload a clearer image of the plant to receive advice.";
    }
    else if (shouldGenerateAnswer) {
        const ragQuery = (0, assistant_prompt_builder_1.extractRagQuery)(question || (cnnResult?.prediction ? `${cnnResult.prediction} plant disease treatment` : "plant disease diagnosis"));
        let ragRetrievedContext;
        if (settings.rag.enabled && settings.rag.endpointUrl) {
            try {
                const ragResult = await (0, rag_provider_1.askRag)(settings, ragQuery, [], args.topK);
                ragRetrievedContext = ragResult.message;
                ragContext = ragRetrievedContext;
            }
            catch (ragError) {
                console.warn("RAG retrieval failed for image chat, proceeding without context:", (0, ai_errors_1.sanitizeErrorMessage)(ragError));
            }
        }
        if (cnnResult?.prediction) {
            try {
                const { DiseaseKnowledgeRecord } = await Promise.resolve().then(() => __importStar(require("../../models/disease_knowledge_record_model")));
                const kbRecord = await DiseaseKnowledgeRecord.findOne({
                    $or: [
                        { diseaseNameEn: cnnResult.prediction },
                        { diseaseNameEn: cnnResult.prediction.replace(/_/g, " ") }
                    ]
                });
                kbAdvice = kbRecord?.advice;
                kbSeverity = kbRecord?.severity;
            }
            catch (err) {
                console.warn("KB lookup failed in orchestrator:", (0, ai_errors_1.sanitizeErrorMessage)(err));
            }
        }
        try {
            const commResult = await (0, community_knowledge_retriever_1.retrieveCommunityContext)(cnnResult?.prediction, question);
            if (commResult.hasData) {
                communityContext = commResult.text;
            }
        }
        catch (error) {
            console.warn("Community context retrieval failed for image chat:", (0, ai_errors_1.sanitizeErrorMessage)(error));
        }
        const prompt = (0, assistant_prompt_builder_1.buildAssistantPrompt)({
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
            lowConfidenceWarning: settings.pipeline.lowConfidenceBehavior === "warn" || settings.pipeline.lowConfidenceBehavior === "ask_for_new_image"
                ? lowConfidenceWarning
                : "",
            ragContext: ragRetrievedContext,
            communityContext,
        });
        let chatResult;
        try {
            chatResult = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory);
        }
        catch (llmError) {
            if (settings.features.allowBackendFallbackToLLM) {
                try {
                    chatResult = await (0, llm_provider_1.askLlm)(settings, prompt, "fallback", sanitizedHistory);
                }
                catch (fallbackError) {
                    throw fallbackError;
                }
            }
            else {
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
        }
        else {
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
        mode: hasFile ? "image_chat" : "chat",
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
        const { evaluateRecommendation } = await Promise.resolve().then(() => __importStar(require("./decision_engine")));
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
    }
    catch (err) {
        console.error("Decision engine failed:", err);
    }
    return responsePayload;
};
exports.orchestrateAssistantRequest = orchestrateAssistantRequest;
