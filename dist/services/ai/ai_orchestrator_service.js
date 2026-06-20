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
const agent_llm_provider_1 = require("./agent_llm_provider");
const agent_tool_registry_1 = require("./agent_tool_registry");
const memory_manager_1 = require("./memory_manager");
const expert_escalation_service_1 = require("../expert_escalation_service");
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
        let optimizedQuery = args.question;
        try {
            const sanitizedQuestion = args.question.replace(/"/g, '\\"');
            const searchPrompt = `Generate a precise agricultural search query to find the best treatment or information in a database for the following question. Output ONLY the search query text, without quotes or extra explanation.\n\nUser Question: ${sanitizedQuestion}`;
            const searchRes = await Promise.race([
                (0, llm_provider_1.askLlm)(settings, searchPrompt, "llm", [], "search"),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Search LLM timeout")), 5000))
            ]);
            optimizedQuery = searchRes.message;
        }
        catch (searchErr) {
            console.warn("[SEARCH_LLM_FAILED] Search LLM failed or not configured, using raw question.");
        }
        try {
            const ragResult = await (0, rag_provider_1.retrieveRagChunks)(settings, "", optimizedQuery, args.topK);
            ragContext = ragResult.contextText;
            console.log(`[RAG_SUCCESS] ${ragResult.chunks.length} chunks retrieved for text chat`);
        }
        catch (error) {
            console.warn("[RAG_FAILED] RAG retrieval failed for text chat:", (0, ai_errors_1.sanitizeErrorMessage)(error));
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
    // Load memory context
    const memoryContext = await memory_manager_1.MemoryManager.getAllContext(args.userId || "anonymous");
    const systemPromptAddition = `\n\nUser Profile & Memory Context: ${JSON.stringify(memoryContext)}`;
    const prompt = (0, assistant_prompt_builder_1.buildAssistantPrompt)({
        userQuestion: args.question,
        history: sanitizedHistory,
        ragContext,
        communityContext,
        language: args.language,
    }) + systemPromptAddition;
    // Use the Agent LLM loop if user provided ID (meaning they're logged in and we want full agent capabilities)
    let chatResult;
    if (args.userId && settings.llm.enabled) {
        console.log("[AGENT] Starting Tool Calling Loop");
        try {
            const agentProvider = new agent_llm_provider_1.AgentLlmProvider();
            const agentResult = await agentProvider.runAgentLoop(settings, args.userId, prompt, // Here we pass the full built prompt with RAG and Memory
            sanitizedHistory, agent_tool_registry_1.AGENT_TOOLS, 15, // ✅ FIX: Raised from 5 to support multi-step tasks
            args.onProgress);
            // Save short-term memory of this interaction
            await memory_manager_1.MemoryManager.saveShortTermMemory(args.userId, `last_chat_${reqId}`, args.question);
            // ✅ NEW: Extract and save long-term user profile facts from conversation
            try {
                const factExtractionPrompt = `Analyze this user message and extract any permanent facts about the user (location, preferred language, farming experience, plant preferences, treatment preferences like organic/chemical). Return JSON: {"facts": [{"key": "string", "value": "string"}]}. If no new facts, return {"facts": []}.

User message: "${args.question.substring(0, 300)}"`;
                const factRes = await (0, llm_provider_1.askLlm)(settings, factExtractionPrompt, "llm", [], "search");
                const parsed = JSON.parse(factRes.message.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
                for (const fact of (parsed.facts || [])) {
                    if (fact.key && fact.value) {
                        await memory_manager_1.MemoryManager.saveLongTermMemory(args.userId, fact.key, fact.value);
                        console.log(`[MEMORY] Saved long-term fact: ${fact.key} = ${fact.value}`);
                    }
                }
            }
            catch (memErr) {
                console.warn("[MEMORY] Long-term fact extraction failed (non-critical):", memErr.message);
            }
            chatResult = { message: agentResult.message, source: "llm", provider: "agent_llm", toolCalls: agentResult.toolCalls };
        }
        catch (agentErr) {
            console.warn("[AGENT_FAILED] Falling back to standard LLM flow. Error:", agentErr.message);
            // FIX [TASK-6.2]: Add SSE phase for simple LLM path
            if (args.onProgress)
                args.onProgress("SIMPLE_LLM_GENERATING");
            chatResult = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory);
        }
    }
    else {
        // FIX [TASK-6.2]: Add SSE phase for simple LLM path
        if (args.onProgress)
            args.onProgress("SIMPLE_LLM_GENERATING");
        chatResult = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory);
    }
    if (chatResult.source === "fallback") {
        console.warn("[LLM] All providers failed, using static fallback.");
    }
    else {
        console.log(`[LLM] Response from: ${chatResult.provider}`);
    }
    // Cascade logic
    if (chatResult.source === "fallback") {
        if (ragContext) {
            console.log("[FINAL_RESPONSE_SOURCE] rag");
            chatResult = { message: ragContext, source: "rag", provider: "rag" };
        }
        else {
            console.log("[FINAL_RESPONSE_SOURCE] fallback");
        }
    }
    else {
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
        toolCalls: chatResult.toolCalls,
    });
    return { message: chatResult.message, source: chatResult.source, provider: chatResult.provider, ragContext, communityContext };
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
        const chat = await (0, exports.orchestrateChat)({ userId: args.userId, requestId: reqId, question, history: sanitizedHistory, topK: args.topK, language: args.language, onProgress: args.onProgress });
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
            console.log("[CNN_SUCCESS]");
        }
        catch (error) {
            console.warn("[CNN_FAILED] CNN diagnosis failed:", (0, ai_errors_1.sanitizeErrorMessage)(error));
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
        // Automatically trigger Expert Escalation Workflow if user is logged in
        if (args.userId && args.originalName) {
            try {
                await expert_escalation_service_1.ExpertEscalationService.requestExpertReview({
                    userId: args.userId,
                    aiPrediction: cnnResult.prediction,
                    aiConfidence: cnnResult.confidence,
                    userContext: args.question || "Uploaded for diagnosis.",
                    imagePath: args.originalName // In reality, this would be an S3 URI or local stored path
                });
                lowConfidenceWarning += " An expert has been notified to review your plant.";
            }
            catch (escErr) {
                console.error("Failed to request expert review:", escErr);
            }
        }
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
        // ── RAG Stage: Pure Knowledge Retrieval ──────────────────────────────────
        let ragRetrievedContext;
        if (settings.rag.enabled && settings.rag.endpointUrl && cnnResult?.prediction) {
            let optimizedQuery = question;
            try {
                const escapedQuestion = question.replace(/"/g, '\\"');
                const escapedPrediction = (cnnResult.prediction || "unknown").replace(/"/g, '\\"');
                const searchPrompt = `Generate a precise agricultural search query to find the best treatment or information in a database for the following question and detected disease. Output ONLY the search query text, without quotes or extra explanation.\n\nDetected Disease: ${escapedPrediction}\nUser Question: ${escapedQuestion}`;
                const searchRes = await Promise.race([
                    (0, llm_provider_1.askLlm)(settings, searchPrompt, "llm", [], "search"),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Search LLM timeout")), 5000))
                ]);
                optimizedQuery = searchRes.message;
            }
            catch (searchErr) {
                console.warn("[SEARCH_LLM_FAILED] Search LLM failed or not configured, using raw question.");
            }
            try {
                const ragResult = await (0, rag_provider_1.retrieveRagChunks)(settings, cnnResult.prediction, optimizedQuery, args.topK);
                ragRetrievedContext = ragResult.contextText;
                ragContext = ragRetrievedContext;
                console.log(`[RAG_SUCCESS] ${ragResult.chunks.length} chunks for "${cnnResult.prediction}"`);
            }
            catch (ragError) {
                console.warn("[RAG_FAILED] RAG /retrieve failed, proceeding without context:", (0, ai_errors_1.sanitizeErrorMessage)(ragError));
            }
        }
        // ─────────────────────────────────────────────────────────────────────────
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
            language: args.language,
        });
        let chatResult;
        // askLlm handles all internal failures and returns a safe fallback
        // object for taskRole "chat" — it never throws. No try/catch needed.
        chatResult = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory);
        if (chatResult.source === "fallback") {
            console.warn("[LLM] All providers failed, using static fallback.");
        }
        else {
            console.log(`[LLM] Response from: ${chatResult.provider}`);
        }
        // Cascade logic
        if (chatResult.source === "fallback") {
            if (ragContext) {
                console.log("[FINAL_RESPONSE_SOURCE] rag");
                chatResult = { message: ragContext, source: "rag", provider: "rag" };
            }
            else if (cnnResult) {
                console.log("[FINAL_RESPONSE_SOURCE] cnn");
                const confStr = typeof cnnResult.confidence === "number" ? (cnnResult.confidence * 100).toFixed(2) + "%" : "Unknown";
                let cnnMessage = `Disease Detected: **${cnnResult.prediction.replace(/_/g, " ")}**\n\nConfidence: ${confStr}\n`;
                if (kbSeverity)
                    cnnMessage += `Severity: ${kbSeverity}\n`;
                if (kbAdvice) {
                    cnnMessage += `\nRecommended Actions:\n${kbAdvice}`;
                }
                else {
                    cnnMessage += `\nPlease monitor your plant carefully and ensure proper watering and light conditions.`;
                }
                chatResult = { message: cnnMessage, source: "cnn", provider: cnnResult.provider || "cnn" };
            }
            else {
                console.log("[FINAL_RESPONSE_SOURCE] fallback");
            }
        }
        else {
            console.log(`[FINAL_RESPONSE_SOURCE] ${chatResult.source}`);
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
        // ✅ FIX: Check real expert availability from DB instead of hardcoding true
        const expertCount = await (await Promise.resolve().then(() => __importStar(require("../../models/user_model")))).default
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
    }
    catch (err) {
        console.error("Decision engine failed:", err);
    }
    return responsePayload;
};
exports.orchestrateAssistantRequest = orchestrateAssistantRequest;
