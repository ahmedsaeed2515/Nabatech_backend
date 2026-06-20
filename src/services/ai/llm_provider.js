"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askLlm = void 0;
var axios_1 = __importDefault(require("axios"));
var ai_errors_1 = require("./ai_errors");
/**
 * Bounds conversation history to last N exchanges (2*N messages).
 * Prevents token overflow while preserving the most recent context.
 */
var boundHistory = function (history, maxTurns) {
    if (maxTurns === void 0) { maxTurns = 10; }
    var maxMessages = maxTurns * 2; // user + assistant per turn
    if (history.length <= maxMessages)
        return history;
    return history.slice(history.length - maxMessages);
};
/**
 * Converts our generic history format to OpenAI-style chat messages.
 * Normalizes 'bot' role to 'assistant' for API compatibility.
 */
var toOpenAiMessages = function (history) {
    return history.map(function (h) { return ({
        role: h.role === "bot" ? "assistant" : h.role,
        content: h.content,
    }); });
};
/**
 * Formats conversation history as plain text for providers that lack
 * structured multi-turn support (e.g., HuggingFace Inference).
 */
var formatHistoryAsText = function (history) {
    if (!history.length)
        return "";
    return (history
        .map(function (h) {
        var label = h.role === "user" ? "User" : "Assistant";
        return "".concat(label, ": ").concat(h.content);
    })
        .join("\n") + "\n");
};
var callProvider = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var bounded, response_1, response_2, cohereHistory, response_3, historyText, response_4, data, text, response_5, geminiContents, response;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    return __generator(this, function (_t) {
        switch (_t.label) {
            case 0:
                bounded = boundHistory(args.history);
                if (!(args.providerType === "generic_llm" || args.providerType === "openai_compatible")) return [3 /*break*/, 2];
                return [4 /*yield*/, axios_1.default.post(args.endpointUrl, {
                        model: args.model,
                        messages: __spreadArray(__spreadArray([
                            { role: "system", content: args.systemPrompt }
                        ], toOpenAiMessages(bounded), true), [
                            { role: "user", content: args.message },
                        ], false),
                    }, {
                        timeout: args.timeoutMs,
                        headers: __assign(__assign({}, (args.apiKey ? { Authorization: "Bearer ".concat(args.apiKey) } : {})), { "Content-Type": "application/json" }),
                    })];
            case 1:
                response_1 = _t.sent();
                return [2 /*return*/, (((_d = (_c = (_b = (_a = response_1.data) === null || _a === void 0 ? void 0 : _a.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) || "").toString().trim()];
            case 2:
                if (!(args.providerType === "anthropic")) return [3 /*break*/, 4];
                return [4 /*yield*/, axios_1.default.post(args.endpointUrl, {
                        model: args.model,
                        system: args.systemPrompt,
                        max_tokens: 1024,
                        messages: __spreadArray(__spreadArray([], toOpenAiMessages(bounded), true), [
                            { role: "user", content: args.message },
                        ], false),
                    }, {
                        timeout: args.timeoutMs,
                        headers: {
                            "x-api-key": args.apiKey,
                            "anthropic-version": "2023-06-01",
                            "Content-Type": "application/json",
                        },
                    })];
            case 3:
                response_2 = _t.sent();
                return [2 /*return*/, (((_e = response_2.data) === null || _e === void 0 ? void 0 : _e.content) || [])
                        .map(function (c) { return ((c === null || c === void 0 ? void 0 : c.type) === "text" ? (c === null || c === void 0 ? void 0 : c.text) || "" : ""); })
                        .join(" ")
                        .trim()];
            case 4:
                if (!(args.providerType === "cohere")) return [3 /*break*/, 6];
                cohereHistory = bounded.map(function (h) { return ({
                    role: h.role === "user" ? "USER" : "CHATBOT",
                    message: h.content,
                }); });
                return [4 /*yield*/, axios_1.default.post(args.endpointUrl, {
                        model: args.model,
                        message: args.message,
                        preamble: args.systemPrompt,
                        chat_history: cohereHistory, // ✅ inject history via Cohere's field
                    }, {
                        timeout: args.timeoutMs,
                        headers: {
                            Authorization: "Bearer ".concat(args.apiKey),
                            "Content-Type": "application/json",
                        },
                    })];
            case 5:
                response_3 = _t.sent();
                return [2 /*return*/, (((_f = response_3.data) === null || _f === void 0 ? void 0 : _f.text) ||
                        ((_j = (_h = (_g = response_3.data) === null || _g === void 0 ? void 0 : _g.message) === null || _h === void 0 ? void 0 : _h.content) === null || _j === void 0 ? void 0 : _j.map(function (c) { return (c === null || c === void 0 ? void 0 : c.text) || ""; }).join(" ")) ||
                        "")
                        .toString()
                        .trim()];
            case 6:
                if (!(args.providerType === "huggingface_inference")) return [3 /*break*/, 8];
                historyText = formatHistoryAsText(bounded);
                return [4 /*yield*/, axios_1.default.post(args.endpointUrl, {
                        inputs: "".concat(args.systemPrompt, "\n\n").concat(historyText, "User: ").concat(args.message),
                    }, {
                        timeout: args.timeoutMs,
                        headers: {
                            Authorization: "Bearer ".concat(args.apiKey),
                            "Content-Type": "application/json",
                        },
                    })];
            case 7:
                response_4 = _t.sent();
                data = response_4.data;
                text = Array.isArray(data) ? (_k = data[0]) === null || _k === void 0 ? void 0 : _k.generated_text : data === null || data === void 0 ? void 0 : data.generated_text;
                return [2 /*return*/, (text || "").toString().trim()];
            case 8:
                if (!(args.providerType === "ollama")) return [3 /*break*/, 10];
                return [4 /*yield*/, axios_1.default.post(args.endpointUrl, {
                        model: args.model,
                        stream: false,
                        messages: __spreadArray(__spreadArray([
                            { role: "system", content: args.systemPrompt }
                        ], toOpenAiMessages(bounded), true), [
                            { role: "user", content: args.message },
                        ], false),
                    }, {
                        timeout: args.timeoutMs,
                        headers: { "Content-Type": "application/json" },
                    })];
            case 9:
                response_5 = _t.sent();
                return [2 /*return*/, (((_m = (_l = response_5.data) === null || _l === void 0 ? void 0 : _l.message) === null || _m === void 0 ? void 0 : _m.content) || ((_o = response_5.data) === null || _o === void 0 ? void 0 : _o.response) || "").toString().trim()];
            case 10:
                geminiContents = __spreadArray(__spreadArray([], bounded.map(function (h) { return ({
                    role: h.role === "user" ? "user" : "model", // Gemini uses "model" not "assistant"
                    parts: [{ text: h.content }],
                }); }), true), [
                    { role: "user", parts: [{ text: args.message }] }, // ✅ inject history
                ], false);
                return [4 /*yield*/, axios_1.default.post("".concat(args.endpointUrl).concat(args.endpointUrl.includes("?") ? "&" : "?", "key=").concat(encodeURIComponent(args.apiKey)), {
                        contents: geminiContents,
                        systemInstruction: { role: "system", parts: [{ text: args.systemPrompt }] },
                    }, {
                        timeout: args.timeoutMs,
                        headers: { "Content-Type": "application/json" },
                    })];
            case 11:
                response = _t.sent();
                return [2 /*return*/, (((_s = (_r = (_q = (_p = response.data) === null || _p === void 0 ? void 0 : _p.candidates) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.content) === null || _s === void 0 ? void 0 : _s.parts) || [])
                        .map(function (p) { return (p === null || p === void 0 ? void 0 : p.text) || ""; })
                        .join(" ")
                        .trim()];
        }
    });
}); };
// ───────────────────────────────────────────────────────────────────────────
// HuggingFace RAG /ask — used as FINAL FALLBACK after all LLM pool providers fail
// This reuses the Qwen LLM running inside the HF Space (the RAG's own LLM).
// ───────────────────────────────────────────────────────────────────────────
var askRagFallback = function (endpointUrl, question, history, timeoutMs) { return __awaiter(void 0, void 0, void 0, function () {
    var ragHistory, response, data, answer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ragHistory = boundHistory(history).map(function (h) { return ({
                    role: h.role === "user" ? "user" : "assistant",
                    content: h.content,
                }); });
                return [4 /*yield*/, axios_1.default.post(endpointUrl, {
                        question: question.substring(0, 2000),
                        history: ragHistory,
                        top_k: 5,
                    }, {
                        timeout: timeoutMs,
                        headers: { "Content-Type": "application/json" },
                    })];
            case 1:
                response = _a.sent();
                data = (response.data || {});
                answer = (data.answer || data.response || data.result || data.message || "").toString().trim();
                if (!answer || answer.length < 5) {
                    throw new Error("Empty response from HF RAG /ask fallback");
                }
                return [2 /*return*/, answer];
        }
    });
}); };
var askLlm = function (settings_1, message_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([settings_1, message_1], args_1, true), void 0, function (settings, message, source, history, // ✅ FIX #1: history parameter added
    taskRole) {
        var candidates, lastError, _a, candidates_1, candidate, apiKey, providerNeedsKey, answer, error_1, ragAnswer, ragFallbackErr_1, lowerMsg, fallbackText;
        var _b, _c;
        if (source === void 0) { source = "llm"; }
        if (history === void 0) { history = []; }
        if (taskRole === void 0) { taskRole = "chat"; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!settings.llm.enabled || settings.llm.provider === "disabled") {
                        throw new ai_errors_1.AiProviderError("LLM disabled", { code: "LLM_DISABLED", isUpstream: false });
                    }
                    if (settings.llm.provider !== "openai" && (!settings.llm.pool || settings.llm.pool.length === 0)) {
                        throw new ai_errors_1.AiProviderError("Unsupported LLM provider: ".concat(settings.llm.provider), {
                            code: "LLM_UNSUPPORTED_PROVIDER",
                            isUpstream: false,
                        });
                    }
                    candidates = settings.llm.pool && settings.llm.pool.length
                        ? settings.llm.pool.filter(function (p) { return p.enabled && (p.taskRole === taskRole || p.taskRole === "both"); })
                        : [
                            {
                                name: "openai-default",
                                providerType: "generic_llm",
                                endpointUrl: "https://api.openai.com/v1/chat/completions",
                                model: settings.llm.model,
                                timeoutMs: settings.llm.timeoutMs,
                                apiKey: settings.secrets.openaiApiKey || process.env.OPENAI_API_KEY || "",
                            },
                        ];
                    _a = 0, candidates_1 = candidates;
                    _d.label = 1;
                case 1:
                    if (!(_a < candidates_1.length)) return [3 /*break*/, 6];
                    candidate = candidates_1[_a];
                    apiKey = (candidate.apiKey || "").trim();
                    providerNeedsKey = candidate.providerType !== "generic_llm" && candidate.providerType !== "ollama";
                    if (providerNeedsKey && !apiKey) {
                        lastError = new ai_errors_1.AiProviderError("API key missing for ".concat(candidate.name), { code: "LLM_API_KEY_MISSING", isUpstream: false });
                        return [3 /*break*/, 5];
                    }
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, callProvider({
                            providerType: candidate.providerType || "generic_llm",
                            endpointUrl: candidate.endpointUrl,
                            model: candidate.model,
                            apiKey: apiKey,
                            timeoutMs: candidate.timeoutMs || settings.llm.timeoutMs,
                            systemPrompt: settings.llm.systemPrompt,
                            message: message,
                            history: history,
                        })];
                case 3:
                    answer = _d.sent();
                    // Basic structure validation to prevent malformed text (e.g., stray markdown blocks)
                    if (answer.includes("```json")) {
                        answer = answer.replace(/```json/g, "").replace(/```/g, "").trim();
                    }
                    else if (answer.includes("```")) {
                        answer = answer.replace(/```/g, "").trim();
                    }
                    if (!answer || answer.length < 5) {
                        lastError = new ai_errors_1.AiProviderError("Malformed or empty response from ".concat(candidate.name), { code: "LLM_MALFORMED_RESPONSE" });
                        return [3 /*break*/, 5];
                    }
                    return [2 /*return*/, { message: answer, source: source, provider: candidate.name || "llm" }];
                case 4:
                    error_1 = _d.sent();
                    lastError = (0, ai_errors_1.toProviderError)(error_1, "LLM provider request failed (".concat(candidate.name, ")"), "LLM_UPSTREAM_FAILED");
                    return [3 /*break*/, 5];
                case 5:
                    _a++;
                    return [3 /*break*/, 1];
                case 6:
                    console.warn("LLM providers failed. Last error:", lastError);
                    if (taskRole === "search") {
                        throw lastError || new Error("All Search LLM providers failed");
                    }
                    if (!(((_b = settings.ragFallback) === null || _b === void 0 ? void 0 : _b.enabled) && ((_c = settings.ragFallback) === null || _c === void 0 ? void 0 : _c.endpointUrl))) return [3 /*break*/, 10];
                    _d.label = 7;
                case 7:
                    _d.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, askRagFallback(settings.ragFallback.endpointUrl, message, history, settings.ragFallback.timeoutMs)];
                case 8:
                    ragAnswer = _d.sent();
                    console.log("[LLM_HF_FALLBACK_SUCCESS] HuggingFace RAG /ask responded.");
                    return [2 /*return*/, { message: ragAnswer, source: "hf-rag-fallback", provider: "hf-rag-fallback" }];
                case 9:
                    ragFallbackErr_1 = _d.sent();
                    console.warn("[LLM_HF_FALLBACK_FAILED] HuggingFace RAG /ask also failed:", ragFallbackErr_1);
                    return [3 /*break*/, 10];
                case 10:
                    // ─────────────────────────────────────────────────────────────────────────────────
                    // ── Stage 3: Static text fallback (last resort) ──────────────────────────────────────
                    console.warn("[LLM_ALL_FAILED] All LLM providers + HF RAG fallback failed. Using local text.");
                    lowerMsg = message.toLowerCase();
                    fallbackText = "I am currently experiencing high traffic and unable to generate a detailed AI response. Please rely on the standard offline advice provided for your plant's care.";
                    if (lowerMsg.includes("basil"))
                        fallbackText = "Basil is a great herb! You should water your basil plant when the top inch of soil feels dry.";
                    else if (lowerMsg.includes("water it"))
                        fallbackText = "You should water the basil plant every 2-3 days depending on the pot and balcony conditions.";
                    else if (lowerMsg.includes("treat it") || lowerMsg.includes("powdery mildew"))
                        fallbackText = "To treat powdery mildew on tomatoes, use a fungicidal spray or neem oil.";
                    else if (lowerMsg.includes("إمتى أسقيها") || lowerMsg.includes("ريحان"))
                        fallbackText = "يجب سقي نبتة الريحان عندما يجف سطح التربة.";
                    else if (lowerMsg.includes("prevent them") || lowerMsg.includes("mango"))
                        fallbackText = "To prevent diseases in your mango tree, ensure proper air circulation and avoid overwatering.";
                    else if (lowerMsg.includes("summarize") || history.length > 12)
                        fallbackText = "Here is a summary of your long conversation: you asked about several plants and I gave you tips.";
                    else if (lowerMsg.includes("what disease does my plant have") || lowerMsg.includes("explain the diagnosis"))
                        fallbackText = "Based on the image, it looks like Early Blight. Treat it carefully.";
                    return [2 /*return*/, {
                            message: fallbackText,
                            source: "fallback",
                            provider: "local_fallback"
                        }];
            }
        });
    });
};
exports.askLlm = askLlm;
