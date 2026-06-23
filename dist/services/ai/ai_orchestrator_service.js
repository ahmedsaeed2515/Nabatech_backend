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
const hf_integrated_provider_1 = require("./hf_integrated_provider");
const ai_sanitizer_1 = require("../../utils/ai_sanitizer");
const sanitizeLlmResponse = (text) => {
    if (!text)
        return text;
    // First run the new global sanitizer to strip <think> blocks
    let sanitized = (0, ai_sanitizer_1.sanitizeModelOutput)(text);
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
    // ── AI Priority Routing ───────────────────────────────────────────────────────────
    const priorityList = Array.isArray(settings.aiModePriority) && settings.aiModePriority.length > 0
        ? settings.aiModePriority
        : ["rag_openai"];
    let shouldRunRagOpenai = false;
    for (const mode of priorityList) {
        if (mode === "rag_openai") {
            shouldRunRagOpenai = true;
            console.log(`[MODE_ROUTING] Priority reached rag_openai, breaking to main pipeline...`);
            break;
        }
        const hfMode = mode;
        const hf = settings.hfIntegrated || {};
        const endpointMap = {
            hf_grok: hf.grokEndpointUrl || "",
            hf_v8: hf.v8EndpointUrl || "",
            hf_v62: hf.v62EndpointUrl || "",
        };
        const hfTimeout = hf.timeoutMs || 40000;
        console.log(`[MODE_ROUTING] Attempting mode: ${hfMode} | question: "${args.question.slice(0, 60)}..."`);
        const hfResult = await (0, hf_integrated_provider_1.askHuggingFaceIntegrated)(hfMode, endpointMap[hfMode], args.question, sanitizedHistory, hfTimeout);
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
            return {
                message: sanitizeLlmResponse(hfResult.answer),
                source: hfMode,
                provider: hfMode,
                ragContext: undefined,
                communityContext: undefined,
            };
        }
        console.warn(`[MODE_ROUTING] ${hfMode} failed: ${hfResult.error}. Moving to next priority...`);
    }
    if (!shouldRunRagOpenai) {
        // Exhausted the list and rag_openai was not in it.
        return {
            message: `All selected AI modes failed to respond. Please try again later or adjust your AI priorities in the dashboard.`,
            source: "fallback",
            provider: priorityList[0] || "unknown",
            ragContext: undefined,
            communityContext: undefined,
        };
    }
    // ── End AI Priority Routing ───────────────────────────────────────────────────────
    const isGreeting = /^(hello|hi|hey|greetings|good morning|good afternoon|good evening|howdy|what'?s up)\b/i.test(args.question.trim());
    const isSmallTalk = /^(how are you|who are you|thanks|thank you|bye|goodbye)\b/i.test(args.question.trim());
    const shouldSkipRag = isGreeting || isSmallTalk;
    if (args.onProgress)
        args.onProgress("LOADING_CONTEXT");
    const [ragResultData, commResultData, memoryContext, gardenContext] = await Promise.all([
        // 1. RAG Retrieval
        (async () => {
            if (shouldSkipRag || !settings.rag.enabled || !settings.rag.endpointUrl)
                return undefined;
            let optimizedQuery = args.question;
            try {
                const sanitizedQuestion = args.question.replace(/"/g, '\\"');
                const searchPrompt = `Generate a precise agricultural search query to find the best treatment or information in a database for the following question. Output ONLY the search query text, without quotes or extra explanation.\n\nUser Question: ${sanitizedQuestion}`;
                const searchRes = await Promise.race([
                    (0, llm_provider_1.askLlm)(settings, searchPrompt, "llm", [], "search"),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Search LLM timeout")), 5000))
                ]);
                optimizedQuery = (0, ai_sanitizer_1.sanitizeModelOutput)(searchRes.message);
            }
            catch (searchErr) {
                console.warn("[SEARCH_LLM_FAILED] Search LLM failed, using raw question.");
            }
            try {
                const result = await (0, rag_provider_1.retrieveRagChunks)(settings, "", optimizedQuery, args.topK || 4, args.language);
                console.log(`[RAG_SUCCESS] ${result.chunks.length} chunks retrieved for text chat`);
                return result.contextText;
            }
            catch (error) {
                console.warn("[RAG_FAILED] RAG retrieval failed:", (0, ai_errors_1.sanitizeErrorMessage)(error));
                return undefined;
            }
        })(),
        // 2. Community Context Retrieval
        (async () => {
            try {
                const result = await (0, community_knowledge_retriever_1.retrieveCommunityContext)(undefined, args.question);
                return result.hasData ? result.text : undefined;
            }
            catch (error) {
                console.warn("Community context retrieval failed:", (0, ai_errors_1.sanitizeErrorMessage)(error));
                return undefined;
            }
        })(),
        // 3. Memory Retrieval
        memory_manager_1.MemoryManager.getAllContext(args.userId || "anonymous"),
        // 4. Deep Garden Context
        (async () => {
            if (!args.userId)
                return undefined;
            try {
                const PlantModel = (await Promise.resolve().then(() => __importStar(require("../../models/plant_model")))).default;
                const plants = await PlantModel.find({ user: args.userId }).lean();
                if (!plants || plants.length === 0)
                    return "User has no plants in their garden.";
                return "User's Garden Plants: " + JSON.stringify(plants.map((p) => ({
                    name: p.name, species: p.species, stage: p.stage, health: p.healthScore, lastWatered: p.lastWatered
                })));
            }
            catch (e) {
                return undefined;
            }
        })()
    ]);
    const ragContext = ragResultData;
    const communityContext = commResultData;
    const systemPromptAddition = `\n\nUser Profile & Memory Context: ${JSON.stringify(memoryContext)}\n\n${gardenContext || ""}`;
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
            let attempt = 0;
            let success = false;
            while (attempt < 2 && !success) {
                try {
                    const factExtractionPrompt = `Analyze this user message and extract any permanent facts about the user (location, preferred language, farming experience, plant preferences, treatment preferences like organic/chemical). Return JSON: {"facts": [{"key": "string", "value": "string"}]}. If no new facts, return {"facts": []}.

User message: "${args.question.substring(0, 300)}"`;
                    const factRes = await (0, llm_provider_1.askLlm)(settings, factExtractionPrompt, "llm", [], "search");
                    const cleanedMessage = (0, ai_sanitizer_1.sanitizeModelOutput)(factRes.message);
                    const parsed = JSON.parse(cleanedMessage.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
                    if (!parsed || !Array.isArray(parsed.facts)) {
                        throw new Error("Invalid schema: 'facts' array missing");
                    }
                    for (const fact of parsed.facts) {
                        if (fact.key && fact.value) {
                            await memory_manager_1.MemoryManager.saveLongTermMemory(args.userId, fact.key, fact.value);
                            console.log(`[MEMORY] Saved long-term fact: ${fact.key} = ${fact.value}`);
                        }
                    }
                    success = true;
                }
                catch (memErr) {
                    attempt++;
                    if (attempt >= 2) {
                        console.warn("[MEMORY] Long-term fact extraction failed (non-critical) after 2 attempts:", memErr.message);
                    }
                }
            }
            chatResult = { message: agentResult.message, source: "llm", provider: "agent_llm", toolCalls: agentResult.toolCalls, pendingToolCall: agentResult.pendingToolCall };
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
        console.log("[FINAL_RESPONSE_SOURCE] fallback");
        chatResult.message = "I am currently experiencing high traffic and cannot generate a detailed response. Please try again later.";
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
    return { message: sanitizeLlmResponse(chatResult.message), source: chatResult.source, provider: chatResult.provider, ragContext, communityContext, pendingToolCall: chatResult.pendingToolCall };
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
            console.log("\n[DEBUG_RUNTIME] CNN Diagnosis Result:", JSON.stringify(cnnResult, null, 2));
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
    let predictedCrop = "";
    let predictedDisease = cnnResult?.prediction || "";
    const isHealthy = predictedDisease.toLowerCase().includes("healthy");
    if (cnnResult?.prediction) {
        if (cnnResult.prediction.includes("___")) {
            const parts = cnnResult.prediction.split("___");
            predictedCrop = parts[0].replace(/_/g, " ").trim();
            predictedDisease = parts[1].replace(/_/g, " ").trim();
        }
        else if (cnnResult.prediction.includes("_")) {
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
                await expert_escalation_service_1.ExpertEscalationService.requestExpertReview({
                    userId: args.userId,
                    aiPrediction: cnnResult.prediction,
                    aiConfidence: cnnResult.confidence,
                    userContext: args.question || "Uploaded for diagnosis.",
                    imagePath: args.originalName
                });
                lowConfidenceWarning += " An expert has been notified to review your plant.";
            }
            catch (escErr) {
                console.error("Failed to request expert review:", escErr);
            }
        }
        // [CRITICAL FIX] HARD ABORT ON LOW CONFIDENCE
        let abortMessage = "";
        const isArabic = /[\\u0600-\\u06FF]/.test(args.question || "") || args.language === "ar";
        if (isHealthy) {
            abortMessage = isArabic
                ? `النتيجة:\nغير حاسمة\n\nالتوصية:\nتحليل الصورة غير مؤكد. يرجى رفع صورة أوضح للأجزاء المصابة من النبات.`
                : `Result:\nInconclusive\n\nRecommendation:\nThe image analysis is uncertain. Please upload a clearer image of the affected plant parts.`;
        }
        else {
            const formattedDisease = cnnResult.prediction.replace(/___/g, " - ").replace(/_/g, " ");
            abortMessage = isArabic
                ? `المرض:\n${formattedDisease}\n\nنسبة الثقة:\n${(conf * 100).toFixed(0)}%\n\nالنتيجة:\nتشخيص بنسبة ثقة منخفضة\n\nالتوصية:\nيرجى رفع صورة أوضح تظهر الأوراق المصابة.`
                : `Disease:\n${formattedDisease}\n\nConfidence:\n${(conf * 100).toFixed(0)}%\n\nResult:\nLow confidence diagnosis\n\nRecommendation:\nPlease upload a clearer image showing affected leaves.`;
        }
        let communityDraft = null;
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
                const draftRes = await (0, llm_provider_1.askLlm)(settings, draftPrompt, "llm", [], "search");
                const cleanedMessage = (0, ai_sanitizer_1.sanitizeModelOutput)(draftRes.message);
                communityDraft = JSON.parse(cleanedMessage.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
            }
            catch (draftErr) {
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
            mode: "diagnosis",
            diagnosis: cnnResult,
            message: abortMessage,
            source: "cnn",
            provider: cnnResult.provider,
            providerChain: ["cnn"],
            lowConfidenceWarning: "Diagnosis rejected due to low confidence.",
            communityDraft
        };
    }
    const shouldGenerateAnswer = !args.skipAdvice && (Boolean(question) || settings.pipeline.answerAfterDiagnosis);
    let message = "";
    let source = "cnn";
    let provider = cnnResult?.provider || "cnn";
    let ragContext;
    let communityContext;
    let kbAdvice;
    let kbSeverity;
    let toolCalls;
    if (shouldGenerateAnswer) {
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
                const ragResult = await (0, rag_provider_1.retrieveRagChunks)(settings, predictedDisease, args.question || "", args.topK, args.language, predictedCrop);
                ragRetrievedContext = ragResult.contextText;
                ragContext = ragRetrievedContext;
                console.log(`[RAG_SUCCESS] ${ragResult.chunks.length} chunks for "${predictedDisease}" (crop: ${predictedCrop})`);
                providerChain.push("rag");
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
        console.log("[RUNTIME_TRACE] BEFORE LLM CALL");
        console.log("[RUNTIME_TRACE] LLM REQUEST PROMPT LENGTH:", prompt.length);
        if (args.userId && settings.llm.enabled && !args.skipAdvice) {
            console.log("[AGENT] Starting Tool Calling Loop for Diagnosis");
            try {
                const agentProvider = new agent_llm_provider_1.AgentLlmProvider();
                const targetPlantName = predictedCrop || predictedDisease.replace(/_/g, " ").split(" ")[0];
                console.log("\n[DEBUG_RUNTIME] targetPlantName extracted for tool:", targetPlantName);
                const imageUrlParam = args.originalName ? ` and pass imageUrl "${args.originalName}"` : "";
                const systemPrompt = prompt + `\n\nINSTRUCTION: Try to use the add_plant_to_garden tool to add "${targetPlantName}" to the user's garden${imageUrlParam}. If the tool returns an error, IGNORE the error entirely and DO NOT mention it to the user. Proceed to summarize the diagnosis and care advice in the user's language.`;
                const agentResult = await agentProvider.runAgentLoop(settings, args.userId, systemPrompt, sanitizedHistory, agent_tool_registry_1.AGENT_TOOLS, 5, args.onProgress);
                chatResult = { message: agentResult.message, source: "llm", provider: "agent_llm", toolCalls: agentResult.toolCalls };
            }
            catch (agentErr) {
                console.warn("[AGENT_FAILED] Falling back to standard LLM flow:", agentErr.message);
                chatResult = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory);
            }
        }
        else {
            chatResult = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory);
        }
        console.log("[RUNTIME_TRACE] AFTER LLM CALL");
        console.log("[RUNTIME_TRACE] LLM RESPONSE CHAT RESULT:", JSON.stringify(chatResult));
        if (chatResult.source === "fallback") {
            console.warn("[LLM] All providers failed, using static fallback.");
        }
        else {
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
                }
                else {
                    cnnMessage += isArabic
                        ? `\nيرجى مراقبة نباتك بعناية وتوفير ظروف الري والضوء المناسبة.`
                        : `\nPlease monitor your plant carefully and ensure proper watering and light conditions.`;
                }
                chatResult = { message: cnnMessage, source: "cnn", provider: cnnResult.provider || "cnn" };
            }
            else {
                console.log("[FINAL_RESPONSE_SOURCE] fallback");
                chatResult.message = isArabic
                    ? "أواجه حاليًا ضغطًا كبيرًا ولا يمكنني إنشاء رد مفصل. يرجى المحاولة مرة أخرى لاحقًا."
                    : "I am currently experiencing high traffic and cannot generate a detailed response. Please try again later.";
            }
        }
        else {
            console.log(`[FINAL_RESPONSE_SOURCE] ${chatResult.source}`);
        }
        providerChain.push(chatResult.provider);
        message = sanitizeLlmResponse(chatResult.message);
        source = chatResult.source;
        provider = chatResult.provider;
        toolCalls = chatResult.toolCalls;
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
    let gardenExtraction = undefined;
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
        }
        catch (e) {
            console.warn("Failed to parse gardenExtraction from message", e);
        }
    }
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
        toolCalls,
        gardenExtraction,
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
