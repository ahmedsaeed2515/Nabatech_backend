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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrateAssistantRequest = exports.orchestrateChat = exports.orchestrateDiagnosis = void 0;
var form_data_1 = __importDefault(require("form-data"));
var ai_call_log_model_1 = __importDefault(require("../../models/ai_call_log_model"));
var llm_provider_1 = require("./llm_provider");
var rag_provider_1 = require("./rag_provider");
var cnn_provider_1 = require("./cnn_provider");
var ai_config_service_1 = require("./ai_config_service");
var ai_errors_1 = require("./ai_errors");
var assistant_prompt_builder_1 = require("./assistant_prompt_builder");
var community_knowledge_retriever_1 = require("./community_knowledge_retriever");
var crypto_1 = __importDefault(require("crypto"));
var agent_llm_provider_1 = require("./agent_llm_provider");
var agent_tool_registry_1 = require("./agent_tool_registry");
var memory_manager_1 = require("./memory_manager");
var expert_escalation_service_1 = require("../expert_escalation_service");
var logAiCall = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_call_log_model_1.default.create(payload)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.warn("AI call logging failed:", (0, ai_errors_1.sanitizeErrorMessage)(error_1));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var validateProviderOutput = function (result) {
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
var orchestrateDiagnosis = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var started, settings, reqId, formData, rawResult, result, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                started = Date.now();
                return [4 /*yield*/, (0, ai_config_service_1.getAiSettings)()];
            case 1:
                settings = _b.sent();
                reqId = args.requestId || crypto_1.default.randomUUID();
                formData = new form_data_1.default();
                formData.append("file", args.fileBuffer, { filename: args.originalName || "image.jpg" });
                _b.label = 2;
            case 2:
                _b.trys.push([2, 5, , 7]);
                return [4 /*yield*/, (0, cnn_provider_1.runCnnDiagnosis)(settings, formData, formData.getHeaders())];
            case 3:
                rawResult = _b.sent();
                result = validateProviderOutput(rawResult);
                return [4 /*yield*/, logAiCall({
                        userId: args.userId,
                        requestId: reqId,
                        feature: "diagnosis",
                        provider: result.provider,
                        status: "success",
                        latencyMs: Date.now() - started,
                        inputMeta: { filename: args.originalName, bytes: args.fileBuffer.length },
                        outputMeta: { confidence: result.confidence, candidatesCount: ((_a = result.candidates) === null || _a === void 0 ? void 0 : _a.length) || 0 },
                    })];
            case 4:
                _b.sent();
                return [2 /*return*/, result];
            case 5:
                error_2 = _b.sent();
                return [4 /*yield*/, logAiCall({
                        userId: args.userId,
                        requestId: reqId,
                        feature: "diagnosis",
                        provider: settings.cnn.provider,
                        status: "failure",
                        latencyMs: Date.now() - started,
                        inputMeta: { filename: args.originalName, bytes: args.fileBuffer.length },
                        errorMessage: (0, ai_errors_1.sanitizeErrorMessage)(error_2),
                    })];
            case 6:
                _b.sent();
                throw error_2;
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.orchestrateDiagnosis = orchestrateDiagnosis;
var orchestrateChat = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, started, reqId, sanitizedHistory, ragContext, optimizedQuery, sanitizedQuestion, searchPrompt, searchRes, searchErr_1, ragResult, error_3, communityContext, commResult, error_4, memoryContext, systemPromptAddition, prompt, chatResult, agentProvider, agentResult, factExtractionPrompt, factRes, parsed, _i, _a, fact, memErr_1, agentErr_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, ai_config_service_1.getAiSettings)()];
            case 1:
                settings = _b.sent();
                started = Date.now();
                reqId = args.requestId || crypto_1.default.randomUUID();
                sanitizedHistory = args.history.filter(function (msg) { return msg.role !== "system"; });
                if (!(settings.rag.enabled && settings.rag.endpointUrl)) return [3 /*break*/, 8];
                optimizedQuery = args.question;
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                sanitizedQuestion = args.question.replace(/"/g, '\\"');
                searchPrompt = "Generate a precise agricultural search query to find the best treatment or information in a database for the following question. Output ONLY the search query text, without quotes or extra explanation.\n\nUser Question: ".concat(sanitizedQuestion);
                return [4 /*yield*/, Promise.race([
                        (0, llm_provider_1.askLlm)(settings, searchPrompt, "llm", [], "search"),
                        new Promise(function (_, reject) { return setTimeout(function () { return reject(new Error("Search LLM timeout")); }, 5000); })
                    ])];
            case 3:
                searchRes = _b.sent();
                optimizedQuery = searchRes.message;
                return [3 /*break*/, 5];
            case 4:
                searchErr_1 = _b.sent();
                console.warn("[SEARCH_LLM_FAILED] Search LLM failed or not configured, using raw question.");
                return [3 /*break*/, 5];
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, (0, rag_provider_1.retrieveRagChunks)(settings, "", optimizedQuery, args.topK)];
            case 6:
                ragResult = _b.sent();
                ragContext = ragResult.contextText;
                console.log("[RAG_SUCCESS] ".concat(ragResult.chunks.length, " chunks retrieved for text chat"));
                return [3 /*break*/, 8];
            case 7:
                error_3 = _b.sent();
                console.warn("[RAG_FAILED] RAG retrieval failed for text chat:", (0, ai_errors_1.sanitizeErrorMessage)(error_3));
                return [3 /*break*/, 8];
            case 8:
                _b.trys.push([8, 10, , 11]);
                return [4 /*yield*/, (0, community_knowledge_retriever_1.retrieveCommunityContext)(undefined, args.question)];
            case 9:
                commResult = _b.sent();
                if (commResult.hasData) {
                    communityContext = commResult.text;
                }
                return [3 /*break*/, 11];
            case 10:
                error_4 = _b.sent();
                console.warn("Community context retrieval failed for text chat:", (0, ai_errors_1.sanitizeErrorMessage)(error_4));
                return [3 /*break*/, 11];
            case 11: return [4 /*yield*/, memory_manager_1.MemoryManager.getAllContext(args.userId || "anonymous")];
            case 12:
                memoryContext = _b.sent();
                systemPromptAddition = "\n\nUser Profile & Memory Context: ".concat(JSON.stringify(memoryContext));
                prompt = (0, assistant_prompt_builder_1.buildAssistantPrompt)({
                    userQuestion: args.question,
                    history: sanitizedHistory,
                    ragContext: ragContext,
                    communityContext: communityContext,
                    language: args.language,
                }) + systemPromptAddition;
                if (!(args.userId && settings.llm.enabled)) return [3 /*break*/, 27];
                console.log("[AGENT] Starting Tool Calling Loop");
                _b.label = 13;
            case 13:
                _b.trys.push([13, 24, , 26]);
                agentProvider = new agent_llm_provider_1.AgentLlmProvider();
                return [4 /*yield*/, agentProvider.runAgentLoop(settings, args.userId, prompt, // Here we pass the full built prompt with RAG and Memory
                    sanitizedHistory, agent_tool_registry_1.AGENT_TOOLS, 15, // ✅ FIX: Raised from 5 to support multi-step tasks
                    args.onProgress)];
            case 14:
                agentResult = _b.sent();
                // Save short-term memory of this interaction
                return [4 /*yield*/, memory_manager_1.MemoryManager.saveShortTermMemory(args.userId, "last_chat_".concat(reqId), args.question)];
            case 15:
                // Save short-term memory of this interaction
                _b.sent();
                _b.label = 16;
            case 16:
                _b.trys.push([16, 22, , 23]);
                factExtractionPrompt = "Analyze this user message and extract any permanent facts about the user (location, preferred language, farming experience, plant preferences, treatment preferences like organic/chemical). Return JSON: {\"facts\": [{\"key\": \"string\", \"value\": \"string\"}]}. If no new facts, return {\"facts\": []}.\n\nUser message: \"".concat(args.question.substring(0, 300), "\"");
                return [4 /*yield*/, (0, llm_provider_1.askLlm)(settings, factExtractionPrompt, "llm", [], "search")];
            case 17:
                factRes = _b.sent();
                parsed = JSON.parse(factRes.message.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
                _i = 0, _a = (parsed.facts || []);
                _b.label = 18;
            case 18:
                if (!(_i < _a.length)) return [3 /*break*/, 21];
                fact = _a[_i];
                if (!(fact.key && fact.value)) return [3 /*break*/, 20];
                return [4 /*yield*/, memory_manager_1.MemoryManager.saveLongTermMemory(args.userId, fact.key, fact.value)];
            case 19:
                _b.sent();
                console.log("[MEMORY] Saved long-term fact: ".concat(fact.key, " = ").concat(fact.value));
                _b.label = 20;
            case 20:
                _i++;
                return [3 /*break*/, 18];
            case 21: return [3 /*break*/, 23];
            case 22:
                memErr_1 = _b.sent();
                console.warn("[MEMORY] Long-term fact extraction failed (non-critical):", memErr_1.message);
                return [3 /*break*/, 23];
            case 23:
                chatResult = { message: agentResult.message, source: "llm", provider: "agent_llm", toolCalls: agentResult.toolCalls };
                return [3 /*break*/, 26];
            case 24:
                agentErr_1 = _b.sent();
                console.warn("[AGENT_FAILED] Falling back to standard LLM flow. Error:", agentErr_1.message);
                // FIX [TASK-6.2]: Add SSE phase for simple LLM path
                if (args.onProgress)
                    args.onProgress("SIMPLE_LLM_GENERATING");
                return [4 /*yield*/, (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory)];
            case 25:
                chatResult = _b.sent();
                return [3 /*break*/, 26];
            case 26: return [3 /*break*/, 29];
            case 27:
                // FIX [TASK-6.2]: Add SSE phase for simple LLM path
                if (args.onProgress)
                    args.onProgress("SIMPLE_LLM_GENERATING");
                return [4 /*yield*/, (0, llm_provider_1.askLlm)(settings, prompt, "llm", sanitizedHistory)];
            case 28:
                chatResult = _b.sent();
                _b.label = 29;
            case 29:
                if (chatResult.source === "fallback") {
                    console.warn("[LLM] All providers failed, using static fallback.");
                }
                else {
                    console.log("[LLM] Response from: ".concat(chatResult.provider));
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
                return [4 /*yield*/, logAiCall({
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
                    })];
            case 30:
                _b.sent();
                return [2 /*return*/, { message: chatResult.message, source: chatResult.source, provider: chatResult.provider, ragContext: ragContext, communityContext: communityContext }];
        }
    });
}); };
exports.orchestrateChat = orchestrateChat;
var orchestrateAssistantRequest = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, started, reqId, question, hasFile, sanitizedHistory, chat, providerChain, cnnResult, lowConfidenceWarning, formData, rawCnn, error_5, isLowConfidence, conf, escErr_1, shouldGenerateAnswer, message, source, provider, ragContext, communityContext, kbAdvice, kbSeverity, ragRetrievedContext, optimizedQuery, escapedQuestion, escapedPrediction, searchPrompt, searchRes, searchErr_2, ragResult, ragError_1, DiseaseKnowledgeRecord, kbRecord, err_1, commResult, error_6, prompt_1, chatResult, confStr, cnnMessage, suffix, responsePayload, evaluateRecommendation, expertCount, decisionResult, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, ai_config_service_1.getAiSettings)()];
            case 1:
                settings = _a.sent();
                started = Date.now();
                reqId = args.requestId || crypto_1.default.randomUUID();
                question = (args.question || "").trim();
                hasFile = Boolean(args.fileBuffer && args.fileBuffer.length);
                sanitizedHistory = args.history.filter(function (msg) { return msg.role !== "system"; });
                if (!hasFile && !question) {
                    throw new Error("Either file or question is required");
                }
                if (!(!hasFile && question)) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, exports.orchestrateChat)({ userId: args.userId, requestId: reqId, question: question, history: sanitizedHistory, topK: args.topK, language: args.language, onProgress: args.onProgress })];
            case 2:
                chat = _a.sent();
                return [2 /*return*/, { mode: "chat", message: chat.message, source: chat.source, provider: chat.provider, providerChain: [chat.provider], ragContext: chat.ragContext, communityContext: chat.communityContext }];
            case 3:
                providerChain = [];
                cnnResult = null;
                lowConfidenceWarning = "";
                if (!settings.pipeline.imageFirst) return [3 /*break*/, 9];
                _a.label = 4;
            case 4:
                _a.trys.push([4, 6, , 9]);
                formData = new form_data_1.default();
                formData.append("file", args.fileBuffer, { filename: args.originalName || "image.jpg" });
                return [4 /*yield*/, (0, cnn_provider_1.runCnnDiagnosis)(settings, formData, formData.getHeaders())];
            case 5:
                rawCnn = _a.sent();
                cnnResult = validateProviderOutput(rawCnn);
                providerChain.push("cnn");
                console.log("[CNN_SUCCESS]");
                return [3 /*break*/, 9];
            case 6:
                error_5 = _a.sent();
                console.warn("[CNN_FAILED] CNN diagnosis failed:", (0, ai_errors_1.sanitizeErrorMessage)(error_5));
                if (!!settings.pipeline.allowAnswerIfCnnFails) return [3 /*break*/, 8];
                return [4 /*yield*/, logAiCall({
                        userId: args.userId,
                        requestId: reqId,
                        feature: "image_chat",
                        provider: "cnn",
                        status: "failure",
                        latencyMs: Date.now() - started,
                        inputMeta: { mode: "image_chat", providerChain: ["cnn"], historyCount: args.history.length },
                        errorMessage: (0, ai_errors_1.sanitizeErrorMessage)(error_5),
                    })];
            case 7:
                _a.sent();
                throw error_5;
            case 8: return [3 /*break*/, 9];
            case 9:
                isLowConfidence = Boolean(cnnResult &&
                    typeof cnnResult.confidence === "number" &&
                    cnnResult.confidence < settings.cnn.confidenceThreshold);
                if (!(isLowConfidence && cnnResult)) return [3 /*break*/, 13];
                conf = typeof cnnResult.confidence === "number" ? cnnResult.confidence : 0;
                lowConfidenceWarning = "Low CNN confidence (".concat(conf.toFixed(3), ") below threshold (").concat(settings.cnn.confidenceThreshold.toFixed(3), ").");
                if (!(args.userId && args.originalName)) return [3 /*break*/, 13];
                _a.label = 10;
            case 10:
                _a.trys.push([10, 12, , 13]);
                return [4 /*yield*/, expert_escalation_service_1.ExpertEscalationService.requestExpertReview({
                        userId: args.userId,
                        aiPrediction: cnnResult.prediction,
                        aiConfidence: cnnResult.confidence,
                        userContext: args.question || "Uploaded for diagnosis.",
                        imagePath: args.originalName // In reality, this would be an S3 URI or local stored path
                    })];
            case 11:
                _a.sent();
                lowConfidenceWarning += " An expert has been notified to review your plant.";
                return [3 /*break*/, 13];
            case 12:
                escErr_1 = _a.sent();
                console.error("Failed to request expert review:", escErr_1);
                return [3 /*break*/, 13];
            case 13:
                shouldGenerateAnswer = !args.skipAdvice &&
                    (Boolean(question) || settings.pipeline.answerAfterDiagnosis) &&
                    !(isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block");
                message = "";
                source = "cnn";
                provider = (cnnResult === null || cnnResult === void 0 ? void 0 : cnnResult.provider) || "cnn";
                if (!(isLowConfidence && settings.pipeline.lowConfidenceBehavior === "block")) return [3 /*break*/, 14];
                message = "The image confidence is too low. Please upload a clearer image of the plant to receive advice.";
                return [3 /*break*/, 31];
            case 14:
                if (!shouldGenerateAnswer) return [3 /*break*/, 31];
                ragRetrievedContext = void 0;
                if (!(settings.rag.enabled && settings.rag.endpointUrl && (cnnResult === null || cnnResult === void 0 ? void 0 : cnnResult.prediction))) return [3 /*break*/, 21];
                optimizedQuery = question;
                _a.label = 15;
            case 15:
                _a.trys.push([15, 17, , 18]);
                escapedQuestion = question.replace(/"/g, '\\"');
                escapedPrediction = (cnnResult.prediction || "unknown").replace(/"/g, '\\"');
                searchPrompt = "Generate a precise agricultural search query to find the best treatment or information in a database for the following question and detected disease. Output ONLY the search query text, without quotes or extra explanation.\n\nDetected Disease: ".concat(escapedPrediction, "\nUser Question: ").concat(escapedQuestion);
                return [4 /*yield*/, Promise.race([
                        (0, llm_provider_1.askLlm)(settings, searchPrompt, "llm", [], "search"),
                        new Promise(function (_, reject) { return setTimeout(function () { return reject(new Error("Search LLM timeout")); }, 5000); })
                    ])];
            case 16:
                searchRes = _a.sent();
                optimizedQuery = searchRes.message;
                return [3 /*break*/, 18];
            case 17:
                searchErr_2 = _a.sent();
                console.warn("[SEARCH_LLM_FAILED] Search LLM failed or not configured, using raw question.");
                return [3 /*break*/, 18];
            case 18:
                _a.trys.push([18, 20, , 21]);
                return [4 /*yield*/, (0, rag_provider_1.retrieveRagChunks)(settings, cnnResult.prediction, optimizedQuery, args.topK)];
            case 19:
                ragResult = _a.sent();
                ragRetrievedContext = ragResult.contextText;
                ragContext = ragRetrievedContext;
                console.log("[RAG_SUCCESS] ".concat(ragResult.chunks.length, " chunks for \"").concat(cnnResult.prediction, "\""));
                return [3 /*break*/, 21];
            case 20:
                ragError_1 = _a.sent();
                console.warn("[RAG_FAILED] RAG /retrieve failed, proceeding without context:", (0, ai_errors_1.sanitizeErrorMessage)(ragError_1));
                return [3 /*break*/, 21];
            case 21:
                if (!(cnnResult === null || cnnResult === void 0 ? void 0 : cnnResult.prediction)) return [3 /*break*/, 26];
                _a.label = 22;
            case 22:
                _a.trys.push([22, 25, , 26]);
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../../models/disease_knowledge_record_model")); })];
            case 23:
                DiseaseKnowledgeRecord = (_a.sent()).DiseaseKnowledgeRecord;
                return [4 /*yield*/, DiseaseKnowledgeRecord.findOne({
                        $or: [
                            { diseaseNameEn: cnnResult.prediction },
                            { diseaseNameEn: cnnResult.prediction.replace(/_/g, " ") }
                        ]
                    })];
            case 24:
                kbRecord = _a.sent();
                kbAdvice = kbRecord === null || kbRecord === void 0 ? void 0 : kbRecord.advice;
                kbSeverity = kbRecord === null || kbRecord === void 0 ? void 0 : kbRecord.severity;
                return [3 /*break*/, 26];
            case 25:
                err_1 = _a.sent();
                console.warn("KB lookup failed in orchestrator:", (0, ai_errors_1.sanitizeErrorMessage)(err_1));
                return [3 /*break*/, 26];
            case 26:
                _a.trys.push([26, 28, , 29]);
                return [4 /*yield*/, (0, community_knowledge_retriever_1.retrieveCommunityContext)(cnnResult === null || cnnResult === void 0 ? void 0 : cnnResult.prediction, question)];
            case 27:
                commResult = _a.sent();
                if (commResult.hasData) {
                    communityContext = commResult.text;
                }
                return [3 /*break*/, 29];
            case 28:
                error_6 = _a.sent();
                console.warn("Community context retrieval failed for image chat:", (0, ai_errors_1.sanitizeErrorMessage)(error_6));
                return [3 /*break*/, 29];
            case 29:
                prompt_1 = (0, assistant_prompt_builder_1.buildAssistantPrompt)({
                    userQuestion: question || "Explain diagnosis and safe care guidance for this plant.",
                    history: sanitizedHistory,
                    cnn: cnnResult
                        ? {
                            prediction: cnnResult.prediction,
                            confidence: cnnResult.confidence,
                            candidates: cnnResult.candidates,
                        }
                        : undefined,
                    kbAdvice: kbAdvice,
                    kbSeverity: kbSeverity,
                    lowConfidenceWarning: settings.pipeline.lowConfidenceBehavior === "warn" || settings.pipeline.lowConfidenceBehavior === "ask_for_new_image"
                        ? lowConfidenceWarning
                        : "",
                    ragContext: ragRetrievedContext,
                    communityContext: communityContext,
                    language: args.language,
                });
                chatResult = void 0;
                return [4 /*yield*/, (0, llm_provider_1.askLlm)(settings, prompt_1, "llm", sanitizedHistory)];
            case 30:
                // askLlm handles all internal failures and returns a safe fallback
                // object for taskRole "chat" — it never throws. No try/catch needed.
                chatResult = _a.sent();
                if (chatResult.source === "fallback") {
                    console.warn("[LLM] All providers failed, using static fallback.");
                }
                else {
                    console.log("[LLM] Response from: ".concat(chatResult.provider));
                }
                // Cascade logic
                if (chatResult.source === "fallback") {
                    if (ragContext) {
                        console.log("[FINAL_RESPONSE_SOURCE] rag");
                        chatResult = { message: ragContext, source: "rag", provider: "rag" };
                    }
                    else if (cnnResult) {
                        console.log("[FINAL_RESPONSE_SOURCE] cnn");
                        confStr = typeof cnnResult.confidence === "number" ? (cnnResult.confidence * 100).toFixed(2) + "%" : "Unknown";
                        cnnMessage = "Disease Detected: **".concat(cnnResult.prediction.replace(/_/g, " "), "**\n\nConfidence: ").concat(confStr, "\n");
                        if (kbSeverity)
                            cnnMessage += "Severity: ".concat(kbSeverity, "\n");
                        if (kbAdvice) {
                            cnnMessage += "\nRecommended Actions:\n".concat(kbAdvice);
                        }
                        else {
                            cnnMessage += "\nPlease monitor your plant carefully and ensure proper watering and light conditions.";
                        }
                        chatResult = { message: cnnMessage, source: "cnn", provider: cnnResult.provider || "cnn" };
                    }
                    else {
                        console.log("[FINAL_RESPONSE_SOURCE] fallback");
                    }
                }
                else {
                    console.log("[FINAL_RESPONSE_SOURCE] ".concat(chatResult.source));
                }
                providerChain.push(chatResult.provider);
                message = chatResult.message;
                source = chatResult.source;
                provider = chatResult.provider;
                _a.label = 31;
            case 31:
                if (isLowConfidence && settings.pipeline.lowConfidenceBehavior === "ask_for_new_image") {
                    suffix = "Please upload a clearer image of the plant for a more accurate analysis.";
                    if (message) {
                        if (!message.endsWith(suffix)) {
                            message += "\n\n".concat(suffix);
                        }
                    }
                    else {
                        message = suffix;
                    }
                }
                return [4 /*yield*/, logAiCall({
                        userId: args.userId,
                        requestId: reqId,
                        feature: hasFile ? "image_chat" : "chat",
                        provider: provider,
                        sourceIds: providerChain,
                        status: "success",
                        latencyMs: Date.now() - started,
                        inputMeta: {
                            mode: hasFile ? "image_chat" : "chat",
                            providerChain: providerChain,
                            historyCount: args.history.length,
                            questionLength: question.length,
                        },
                        outputMeta: {
                            confidence: cnnResult === null || cnnResult === void 0 ? void 0 : cnnResult.confidence,
                            responseLength: (message === null || message === void 0 ? void 0 : message.length) || 0,
                            source: source,
                            ragContextLength: (ragContext === null || ragContext === void 0 ? void 0 : ragContext.length) || 0,
                        },
                    })];
            case 32:
                _a.sent();
                responsePayload = {
                    mode: hasFile ? "image_chat" : "chat",
                    diagnosis: cnnResult
                        ? {
                            prediction: cnnResult.prediction,
                            confidence: cnnResult.confidence,
                            candidates: cnnResult.candidates || [],
                            provider: cnnResult.provider,
                        }
                        : undefined,
                    message: message,
                    source: source,
                    provider: provider,
                    lowConfidenceWarning: isLowConfidence ? lowConfidenceWarning : "",
                    needsNewImage: isLowConfidence && (settings.pipeline.lowConfidenceBehavior === "block" || settings.pipeline.lowConfidenceBehavior === "ask_for_new_image"),
                    recommendedAction: !isLowConfidence
                        ? undefined
                        : settings.pipeline.lowConfidenceBehavior === "warn"
                            ? "review_with_caution"
                            : "upload_clearer_image",
                    providerChain: providerChain,
                    ragContext: ragContext,
                    communityContext: communityContext,
                    kbAdvice: kbAdvice,
                    kbSeverity: kbSeverity,
                };
                _a.label = 33;
            case 33:
                _a.trys.push([33, 37, , 38]);
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("./decision_engine")); })];
            case 34:
                evaluateRecommendation = (_a.sent()).evaluateRecommendation;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../../models/user_model")); })];
            case 35: return [4 /*yield*/, (_a.sent()).default
                    .countDocuments({ role: "expert" })
                    .catch(function () { return 0; })];
            case 36:
                expertCount = _a.sent();
                decisionResult = evaluateRecommendation({
                    confidence: cnnResult === null || cnnResult === void 0 ? void 0 : cnnResult.confidence,
                    diseaseName: cnnResult === null || cnnResult === void 0 ? void 0 : cnnResult.prediction,
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
                return [3 /*break*/, 38];
            case 37:
                err_2 = _a.sent();
                console.error("Decision engine failed:", err_2);
                return [3 /*break*/, 38];
            case 38: return [2 /*return*/, responsePayload];
        }
    });
}); };
exports.orchestrateAssistantRequest = orchestrateAssistantRequest;
