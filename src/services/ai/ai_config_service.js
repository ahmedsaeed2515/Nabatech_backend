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
exports.redactAiSettings = exports.updateAiSettings = exports.getAiSettings = void 0;
var ai_settings_model_1 = __importDefault(require("../../models/ai_settings_model"));
var secret_crypto_1 = require("./secret_crypto");
// ─── Settings Cache ───────────────────────────────────────────
var _settingsCache = null;
var _settingsCacheTs = 0;
var SETTINGS_CACHE_TTL_MS = 60000; // 1 minute
var toNum = function (value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};
var toBool = function (value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string") {
        var v = value.trim().toLowerCase();
        if (v === "true")
            return true;
        if (v === "false")
            return false;
    }
    return null;
};
var toValidNumber = function (value, min, max, field) {
    var n = typeof value === "string" ? Number(value.trim()) : Number(value);
    if (!Number.isFinite(n) || n < min || n > max) {
        throw new Error("".concat(field, " must be between ").concat(min, " and ").concat(max));
    }
    return n;
};
var trimString = function (value, field) {
    if (typeof value !== "string")
        throw new Error("".concat(field, " must be a string"));
    return value.trim();
};
var validateHttpUrl = function (value, field) {
    try {
        var url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error("".concat(field, " must be a valid http/https URL"));
        }
        return value;
    }
    catch (_a) {
        throw new Error("".concat(field, " must be a valid http/https URL"));
    }
};
var dedupe = function (arr) {
    return Array.from(new Set(arr));
};
var normalizeStringArray = function (raw, allowed, field) {
    var allowedSet = new Set(allowed);
    var normalizedRaw = raw.map(function (x) { return String(x).trim().toLowerCase(); });
    var invalid = normalizedRaw.filter(function (x) { return !allowedSet.has(x); });
    if (invalid.length) {
        throw new Error("".concat(field, " can contain only ").concat(allowed.join(" and ")));
    }
    return dedupe(normalizedRaw);
};
var envDefaults = function () { return ({
    key: "default",
    cnn: {
        enabled: true,
        provider: process.env.CNN_PROVIDER || "huggingface-space",
        endpointUrl: process.env.IMAGE_API_URL || process.env.CNN_ENDPOINT_URL || "",
        timeoutMs: toNum(process.env.AI_CNN_TIMEOUT_MS, 60000),
        inputSize: toNum(process.env.CNN_INPUT_SIZE, 224),
        preprocessRequired: (process.env.CNN_PREPROCESS_REQUIRED || "false").toLowerCase() === "true",
        confidenceThreshold: toNum(process.env.CNN_CONFIDENCE_THRESHOLD, 0),
        pool: [],
    },
    rag: {
        enabled: true,
        endpointUrl: process.env.NEW_RAG_URL || process.env.CHAT_API_URL || process.env.RAG_ENDPOINT_URL || "",
        timeoutMs: toNum(process.env.AI_RAG_TIMEOUT_MS, 20000),
        topK: toNum(process.env.AI_CHAT_TOP_K, 8),
    },
    llm: {
        enabled: true,
        provider: ((process.env.LLM_PROVIDER || "openai") === "disabled" ? "disabled" : "openai"),
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        timeoutMs: toNum(process.env.AI_LLM_TIMEOUT_MS, 25000),
        systemPrompt: process.env.AI_SYSTEM_PROMPT || "You are a helpful agriculture assistant.",
        pool: [],
    },
    ragFallback: {
        enabled: (process.env.RAG_FALLBACK_ENABLED || "true").toLowerCase() === "true",
        endpointUrl: (process.env.NEW_RAG_URL || process.env.CHAT_API_URL || process.env.RAG_ENDPOINT_URL || "").replace(/\/retrieve$/, "").replace(/\/$/, "") + "/ask",
        timeoutMs: toNum(process.env.RAG_FALLBACK_TIMEOUT_MS, 60000),
    },
    fallback: {
        chatOrder: dedupe((process.env.AI_CHAT_FALLBACK_ORDER || "rag,llm").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s === "rag" || s === "llm"; })),
        diagnosisOrder: dedupe((process.env.AI_DIAGNOSIS_FALLBACK_ORDER || "cnn").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s === "cnn"; })),
    },
    features: {
        allowFlutterOfflineModel: (process.env.AI_ALLOW_FLUTTER_OFFLINE_MODEL || "true").toLowerCase() === "true",
        allowBackendFallbackToLLM: (process.env.AI_ALLOW_BACKEND_FALLBACK_TO_LLM || "true").toLowerCase() === "true",
    },
    pipeline: {
        imageFirst: (process.env.AI_PIPELINE_IMAGE_FIRST || "true").toLowerCase() === "true",
        answerAfterDiagnosis: (process.env.AI_PIPELINE_ANSWER_AFTER_DIAGNOSIS || "true").toLowerCase() === "true",
        allowAnswerIfCnnFails: (process.env.AI_PIPELINE_ALLOW_ANSWER_IF_CNN_FAILS || "false").toLowerCase() === "true",
        lowConfidenceBehavior: (["warn", "ask_for_new_image", "block"].includes((process.env.AI_PIPELINE_LOW_CONFIDENCE_BEHAVIOR || "").toLowerCase())
            ? (process.env.AI_PIPELINE_LOW_CONFIDENCE_BEHAVIOR || "warn").toLowerCase()
            : "warn"),
    },
    secrets: {
        openaiApiKey: "",
        ragApiKey: "",
        cnnApiKey: "",
    },
}); };
var mergeSettings = function (defaults, db) {
    var _a, _b, _c, _d, _e;
    if (!db)
        return defaults;
    var plain = db.toObject ? db.toObject() : db;
    return __assign(__assign(__assign({}, defaults), plain), { cnn: __assign(__assign(__assign({}, defaults.cnn), (plain.cnn || {})), { pool: Array.isArray((_a = plain === null || plain === void 0 ? void 0 : plain.cnn) === null || _a === void 0 ? void 0 : _a.pool)
                ? plain.cnn.pool.map(function (p) { return ({
                    name: String((p === null || p === void 0 ? void 0 : p.name) || "").trim(),
                    enabled: (p === null || p === void 0 ? void 0 : p.enabled) !== false,
                    endpointUrl: String((p === null || p === void 0 ? void 0 : p.endpointUrl) || "").trim(),
                    apiKey: (0, secret_crypto_1.decryptSecret)(String((p === null || p === void 0 ? void 0 : p.apiKeyEnc) || "")),
                    timeoutMs: Number.isFinite(Number(p === null || p === void 0 ? void 0 : p.timeoutMs)) ? Number(p.timeoutMs) : undefined,
                }); })
                : defaults.cnn.pool }), rag: __assign(__assign({}, defaults.rag), (plain.rag || {})), ragFallback: __assign(__assign({}, defaults.ragFallback), (plain.ragFallback || {})), llm: __assign(__assign(__assign({}, defaults.llm), (plain.llm || {})), { pool: Array.isArray((_b = plain === null || plain === void 0 ? void 0 : plain.llm) === null || _b === void 0 ? void 0 : _b.pool)
                ? plain.llm.pool.map(function (p) { return ({
                    name: String((p === null || p === void 0 ? void 0 : p.name) || "").trim(),
                    enabled: (p === null || p === void 0 ? void 0 : p.enabled) !== false,
                    providerType: (["generic_llm", "openai_compatible", "anthropic", "gemini", "cohere", "huggingface_inference", "ollama"].includes(String((p === null || p === void 0 ? void 0 : p.providerType) || "").toLowerCase())
                        ? String((p === null || p === void 0 ? void 0 : p.providerType) || "").toLowerCase()
                        : "generic_llm"),
                    endpointUrl: String((p === null || p === void 0 ? void 0 : p.endpointUrl) || "").trim(),
                    model: String((p === null || p === void 0 ? void 0 : p.model) || "").trim(),
                    taskRole: (["search", "chat", "both"].includes(String((p === null || p === void 0 ? void 0 : p.taskRole) || "").toLowerCase()) ? String((p === null || p === void 0 ? void 0 : p.taskRole) || "").toLowerCase() : "both"),
                    apiKey: (0, secret_crypto_1.decryptSecret)(String((p === null || p === void 0 ? void 0 : p.apiKeyEnc) || "")),
                    timeoutMs: Number.isFinite(Number(p === null || p === void 0 ? void 0 : p.timeoutMs)) ? Number(p.timeoutMs) : undefined,
                }); })
                : defaults.llm.pool }), fallback: __assign(__assign({}, defaults.fallback), (plain.fallback || {})), features: __assign(__assign({}, defaults.features), (plain.features || {})), pipeline: __assign(__assign({}, defaults.pipeline), (plain.pipeline || {})), secrets: {
            openaiApiKey: (0, secret_crypto_1.decryptSecret)(((_c = plain === null || plain === void 0 ? void 0 : plain.secrets) === null || _c === void 0 ? void 0 : _c.openaiApiKeyEnc) || ""),
            ragApiKey: (0, secret_crypto_1.decryptSecret)(((_d = plain === null || plain === void 0 ? void 0 : plain.secrets) === null || _d === void 0 ? void 0 : _d.ragApiKeyEnc) || ""),
            cnnApiKey: (0, secret_crypto_1.decryptSecret)(((_e = plain === null || plain === void 0 ? void 0 : plain.secrets) === null || _e === void 0 ? void 0 : _e.cnnApiKeyEnc) || ""),
        } });
};
var getAiSettings = function () { return __awaiter(void 0, void 0, void 0, function () {
    var now, defaults, stored, settings, AiRoutingRule, rules, llmPool, cnnPool, _i, rules_1, rule, primary, provider, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                now = Date.now();
                if (_settingsCache && now - _settingsCacheTs < SETTINGS_CACHE_TTL_MS) {
                    return [2 /*return*/, _settingsCache];
                }
                defaults = envDefaults();
                return [4 /*yield*/, ai_settings_model_1.default.findOne({ key: "default" })];
            case 1:
                stored = _a.sent();
                settings = mergeSettings(defaults, stored);
                _a.label = 2;
            case 2:
                _a.trys.push([2, 5, , 6]);
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../../models/ai_routing_rule_model")); })];
            case 3:
                AiRoutingRule = (_a.sent()).default;
                return [4 /*yield*/, AiRoutingRule.find({ active: true })
                        .populate({
                        path: "primaryModel",
                        populate: { path: "provider" }
                    })
                        .populate({
                        path: "fallbackModels",
                        populate: { path: "provider" }
                    })];
            case 4:
                rules = _a.sent();
                llmPool = [];
                cnnPool = [];
                for (_i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
                    rule = rules_1[_i];
                    if (!rule.primaryModel)
                        continue;
                    primary = rule.primaryModel;
                    provider = primary.provider;
                    if (!provider)
                        continue;
                    if (rule.useCase === "diagnosis") {
                        cnnPool.push({
                            name: primary.displayName,
                            enabled: true,
                            endpointUrl: provider.baseUrl || "",
                            apiKey: provider.apiKeyEnc ? (0, secret_crypto_1.decryptSecret)(provider.apiKeyEnc) : "",
                            timeoutMs: 60000
                        });
                    }
                    else {
                        llmPool.push({
                            name: primary.displayName,
                            enabled: true,
                            providerType: provider.name === "openai" ? "openai_compatible" : "generic_llm",
                            endpointUrl: provider.baseUrl || "",
                            model: primary.modelId,
                            taskRole: rule.useCase === "assistant" ? "chat" : "both",
                            apiKey: provider.apiKeyEnc ? (0, secret_crypto_1.decryptSecret)(provider.apiKeyEnc) : "",
                            timeoutMs: 25000
                        });
                    }
                }
                if (cnnPool.length > 0) {
                    settings.cnn.pool = cnnPool;
                    settings.cnn.provider = cnnPool[0].name;
                    settings.cnn.endpointUrl = cnnPool[0].endpointUrl;
                    settings.secrets.cnnApiKey = cnnPool[0].apiKey;
                }
                if (llmPool.length > 0) {
                    settings.llm.pool = llmPool;
                    settings.llm.provider = "openai"; // or map correctly
                    settings.llm.model = llmPool[0].model;
                    settings.secrets.openaiApiKey = llmPool[0].apiKey;
                }
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                console.warn("Failed to fetch dynamic AI routing rules, falling back to static config:", error_1);
                return [3 /*break*/, 6];
            case 6:
                _settingsCache = settings;
                _settingsCacheTs = now;
                return [2 /*return*/, _settingsCache];
        }
    });
}); };
exports.getAiSettings = getAiSettings;
var assertAllowedTopKeys = function (payload) {
    var allowed = new Set(["cnn", "rag", "ragFallback", "llm", "fallback", "features", "pipeline", "secrets"]);
    var disallowed = Object.keys(payload).filter(function (k) { return !allowed.has(k); });
    if (disallowed.length) {
        throw new Error("Unknown fields are not allowed: ".concat(disallowed.join(", ")));
    }
};
var sanitizePayload = function (payload, current) {
    assertAllowedTopKeys(payload);
    var out = {};
    if (payload.cnn !== undefined) {
        if (!payload.cnn || typeof payload.cnn !== "object" || Array.isArray(payload.cnn))
            throw new Error("cnn must be an object");
        var cnnRaw = payload.cnn;
        var cnnAllowed_1 = new Set(["enabled", "provider", "endpointUrl", "timeoutMs", "inputSize", "preprocessRequired", "confidenceThreshold", "pool"]);
        var cnnUnknown = Object.keys(cnnRaw).filter(function (k) { return !cnnAllowed_1.has(k); });
        if (cnnUnknown.length)
            throw new Error("Unknown cnn fields: ".concat(cnnUnknown.join(", ")));
        var cnn = {};
        if (cnnRaw.enabled !== undefined) {
            var b = toBool(cnnRaw.enabled);
            if (b === null)
                throw new Error("cnn.enabled must be boolean");
            cnn.enabled = b;
        }
        if (cnnRaw.provider !== undefined) {
            var p = trimString(cnnRaw.provider, "cnn.provider");
            if (!p)
                throw new Error("cnn.provider must be non-empty");
            cnn.provider = p;
        }
        if (cnnRaw.endpointUrl !== undefined) {
            var endpoint = trimString(cnnRaw.endpointUrl, "cnn.endpointUrl");
            cnn.endpointUrl = endpoint;
        }
        if (cnnRaw.timeoutMs !== undefined)
            cnn.timeoutMs = toValidNumber(cnnRaw.timeoutMs, 1000, 120000, "cnn.timeoutMs");
        if (cnnRaw.inputSize !== undefined)
            cnn.inputSize = toValidNumber(cnnRaw.inputSize, 32, 4096, "cnn.inputSize");
        if (cnnRaw.preprocessRequired !== undefined) {
            var b = toBool(cnnRaw.preprocessRequired);
            if (b === null)
                throw new Error("cnn.preprocessRequired must be boolean");
            cnn.preprocessRequired = b;
        }
        if (cnnRaw.confidenceThreshold !== undefined)
            cnn.confidenceThreshold = toValidNumber(cnnRaw.confidenceThreshold, 0, 1, "cnn.confidenceThreshold");
        if (cnnRaw.pool !== undefined) {
            if (!Array.isArray(cnnRaw.pool))
                throw new Error("cnn.pool must be an array");
            cnn.pool = cnnRaw.pool.map(function (item, idx) {
                var _a, _b, _c;
                if (!item || typeof item !== "object" || Array.isArray(item))
                    throw new Error("cnn.pool[".concat(idx, "] must be an object"));
                var raw = item;
                var allowed = new Set(["name", "enabled", "endpointUrl", "apiKey", "timeoutMs"]);
                var unknown = Object.keys(raw).filter(function (k) { return !allowed.has(k); });
                if (unknown.length)
                    throw new Error("Unknown cnn.pool fields at index ".concat(idx, ": ").concat(unknown.join(", ")));
                var enabled = raw.enabled === undefined ? true : toBool(raw.enabled);
                if (enabled === null)
                    throw new Error("cnn.pool[".concat(idx, "].enabled must be boolean"));
                var endpointUrl = trimString((_a = raw.endpointUrl) !== null && _a !== void 0 ? _a : "", "cnn.pool[".concat(idx, "].endpointUrl"));
                if (!endpointUrl)
                    throw new Error("cnn.pool[".concat(idx, "].endpointUrl is required"));
                validateHttpUrl(endpointUrl, "cnn.pool[".concat(idx, "].endpointUrl"));
                var name = trimString((_b = raw.name) !== null && _b !== void 0 ? _b : "cnn-".concat(idx + 1), "cnn.pool[".concat(idx, "].name")) || "cnn-".concat(idx + 1);
                var apiKey = trimString((_c = raw.apiKey) !== null && _c !== void 0 ? _c : "", "cnn.pool[".concat(idx, "].apiKey"));
                var timeoutMs = raw.timeoutMs === undefined ? undefined : toValidNumber(raw.timeoutMs, 1000, 120000, "cnn.pool[".concat(idx, "].timeoutMs"));
                return { name: name, enabled: enabled, endpointUrl: endpointUrl, apiKey: apiKey, timeoutMs: timeoutMs };
            });
        }
        out.cnn = cnn;
    }
    if (payload.rag !== undefined) {
        if (!payload.rag || typeof payload.rag !== "object" || Array.isArray(payload.rag))
            throw new Error("rag must be an object");
        var ragRaw = payload.rag;
        var ragAllowed_1 = new Set(["enabled", "endpointUrl", "timeoutMs", "topK"]);
        var ragUnknown = Object.keys(ragRaw).filter(function (k) { return !ragAllowed_1.has(k); });
        if (ragUnknown.length)
            throw new Error("Unknown rag fields: ".concat(ragUnknown.join(", ")));
        var rag = {};
        if (ragRaw.enabled !== undefined) {
            var b = toBool(ragRaw.enabled);
            if (b === null)
                throw new Error("rag.enabled must be boolean");
            rag.enabled = b;
        }
        if (ragRaw.endpointUrl !== undefined)
            rag.endpointUrl = trimString(ragRaw.endpointUrl, "rag.endpointUrl");
        if (ragRaw.timeoutMs !== undefined)
            rag.timeoutMs = toValidNumber(ragRaw.timeoutMs, 1000, 120000, "rag.timeoutMs");
        if (ragRaw.topK !== undefined)
            rag.topK = toValidNumber(ragRaw.topK, 1, 100, "rag.topK");
        out.rag = rag;
    }
    if (payload.llm !== undefined) {
        if (!payload.llm || typeof payload.llm !== "object" || Array.isArray(payload.llm))
            throw new Error("llm must be an object");
        var llmRaw = payload.llm;
        var llmAllowed_1 = new Set(["enabled", "provider", "model", "timeoutMs", "systemPrompt", "pool"]);
        var llmUnknown = Object.keys(llmRaw).filter(function (k) { return !llmAllowed_1.has(k); });
        if (llmUnknown.length)
            throw new Error("Unknown llm fields: ".concat(llmUnknown.join(", ")));
        var llm = {};
        if (llmRaw.enabled !== undefined) {
            var b = toBool(llmRaw.enabled);
            if (b === null)
                throw new Error("llm.enabled must be boolean");
            llm.enabled = b;
        }
        if (llmRaw.provider !== undefined) {
            var provider = trimString(llmRaw.provider, "llm.provider").toLowerCase();
            if (provider !== "openai" && provider !== "disabled")
                throw new Error("llm.provider must be openai or disabled");
            llm.provider = provider;
        }
        if (llmRaw.model !== undefined)
            llm.model = trimString(llmRaw.model, "llm.model");
        if (llmRaw.timeoutMs !== undefined)
            llm.timeoutMs = toValidNumber(llmRaw.timeoutMs, 1000, 120000, "llm.timeoutMs");
        if (llmRaw.systemPrompt !== undefined)
            llm.systemPrompt = trimString(llmRaw.systemPrompt, "llm.systemPrompt");
        if (llmRaw.pool !== undefined) {
            if (!Array.isArray(llmRaw.pool))
                throw new Error("llm.pool must be an array");
            llm.pool = llmRaw.pool.map(function (item, idx) {
                var _a, _b, _c, _d, _e, _f;
                if (!item || typeof item !== "object" || Array.isArray(item))
                    throw new Error("llm.pool[".concat(idx, "] must be an object"));
                var raw = item;
                var allowed = new Set(["name", "enabled", "providerType", "endpointUrl", "model", "taskRole", "apiKey", "timeoutMs"]);
                var unknown = Object.keys(raw).filter(function (k) { return !allowed.has(k); });
                if (unknown.length)
                    throw new Error("Unknown llm.pool fields at index ".concat(idx, ": ").concat(unknown.join(", ")));
                var enabled = raw.enabled === undefined ? true : toBool(raw.enabled);
                if (enabled === null)
                    throw new Error("llm.pool[".concat(idx, "].enabled must be boolean"));
                var providerTypeRaw = trimString((_a = raw.providerType) !== null && _a !== void 0 ? _a : "generic_llm", "llm.pool[".concat(idx, "].providerType")).toLowerCase();
                if (providerTypeRaw !== "generic_llm" &&
                    providerTypeRaw !== "openai_compatible" &&
                    providerTypeRaw !== "anthropic" &&
                    providerTypeRaw !== "gemini" &&
                    providerTypeRaw !== "cohere" &&
                    providerTypeRaw !== "huggingface_inference" &&
                    providerTypeRaw !== "ollama") {
                    throw new Error("llm.pool[${idx}].providerType must be generic_llm, openai_compatible, anthropic, gemini, cohere, huggingface_inference, or ollama");
                }
                var endpointUrl = trimString((_b = raw.endpointUrl) !== null && _b !== void 0 ? _b : "", "llm.pool[".concat(idx, "].endpointUrl"));
                if (!endpointUrl)
                    throw new Error("llm.pool[".concat(idx, "].endpointUrl is required"));
                validateHttpUrl(endpointUrl, "llm.pool[".concat(idx, "].endpointUrl"));
                var model = trimString((_c = raw.model) !== null && _c !== void 0 ? _c : "", "llm.pool[".concat(idx, "].model"));
                if (!model)
                    throw new Error("llm.pool[".concat(idx, "].model is required"));
                var name = trimString((_d = raw.name) !== null && _d !== void 0 ? _d : "llm-".concat(idx + 1), "llm.pool[".concat(idx, "].name")) || "llm-".concat(idx + 1);
                var apiKey = trimString((_e = raw.apiKey) !== null && _e !== void 0 ? _e : "", "llm.pool[".concat(idx, "].apiKey"));
                var timeoutMs = raw.timeoutMs === undefined ? undefined : toValidNumber(raw.timeoutMs, 1000, 120000, "llm.pool[".concat(idx, "].timeoutMs"));
                var taskRoleRaw = trimString((_f = raw.taskRole) !== null && _f !== void 0 ? _f : "both", "llm.pool[".concat(idx, "].taskRole")).toLowerCase();
                if (taskRoleRaw !== "search" && taskRoleRaw !== "chat" && taskRoleRaw !== "both") {
                    throw new Error("llm.pool[".concat(idx, "].taskRole must be search, chat, or both"));
                }
                return {
                    name: name,
                    enabled: enabled,
                    providerType: providerTypeRaw,
                    endpointUrl: endpointUrl,
                    model: model,
                    taskRole: taskRoleRaw,
                    apiKey: apiKey,
                    timeoutMs: timeoutMs,
                };
            });
        }
        out.llm = llm;
    }
    if (payload.fallback !== undefined) {
        if (!payload.fallback || typeof payload.fallback !== "object" || Array.isArray(payload.fallback))
            throw new Error("fallback must be an object");
        var fallbackRaw = payload.fallback;
        var fallbackAllowed_1 = new Set(["chatOrder", "diagnosisOrder"]);
        var fallbackUnknown = Object.keys(fallbackRaw).filter(function (k) { return !fallbackAllowed_1.has(k); });
        if (fallbackUnknown.length)
            throw new Error("Unknown fallback fields: ".concat(fallbackUnknown.join(", ")));
        var fallback = {};
        if (fallbackRaw.chatOrder !== undefined) {
            if (!Array.isArray(fallbackRaw.chatOrder))
                throw new Error("fallback.chatOrder must be an array");
            var normalized = normalizeStringArray(fallbackRaw.chatOrder, ["rag", "llm"], "fallback.chatOrder");
            fallback.chatOrder = normalized;
        }
        if (fallbackRaw.diagnosisOrder !== undefined) {
            if (!Array.isArray(fallbackRaw.diagnosisOrder))
                throw new Error("fallback.diagnosisOrder must be an array");
            var normalized = normalizeStringArray(fallbackRaw.diagnosisOrder, ["cnn"], "fallback.diagnosisOrder");
            fallback.diagnosisOrder = normalized;
        }
        out.fallback = fallback;
    }
    if (payload.features !== undefined) {
        if (!payload.features || typeof payload.features !== "object" || Array.isArray(payload.features))
            throw new Error("features must be an object");
        var featuresRaw = payload.features;
        var featuresAllowed_1 = new Set(["allowFlutterOfflineModel", "allowBackendFallbackToLLM"]);
        var featuresUnknown = Object.keys(featuresRaw).filter(function (k) { return !featuresAllowed_1.has(k); });
        if (featuresUnknown.length)
            throw new Error("Unknown features fields: ".concat(featuresUnknown.join(", ")));
        var features = {};
        if (featuresRaw.allowFlutterOfflineModel !== undefined) {
            var b = toBool(featuresRaw.allowFlutterOfflineModel);
            if (b === null)
                throw new Error("features.allowFlutterOfflineModel must be boolean");
            features.allowFlutterOfflineModel = b;
        }
        if (featuresRaw.allowBackendFallbackToLLM !== undefined) {
            var b = toBool(featuresRaw.allowBackendFallbackToLLM);
            if (b === null)
                throw new Error("features.allowBackendFallbackToLLM must be boolean");
            features.allowBackendFallbackToLLM = b;
        }
        out.features = features;
    }
    if (payload.pipeline !== undefined) {
        if (!payload.pipeline || typeof payload.pipeline !== "object" || Array.isArray(payload.pipeline))
            throw new Error("pipeline must be an object");
        var pipelineRaw = payload.pipeline;
        var pipelineAllowed_1 = new Set(["imageFirst", "answerAfterDiagnosis", "allowAnswerIfCnnFails", "lowConfidenceBehavior"]);
        var pipelineUnknown = Object.keys(pipelineRaw).filter(function (k) { return !pipelineAllowed_1.has(k); });
        if (pipelineUnknown.length)
            throw new Error("Unknown pipeline fields: ".concat(pipelineUnknown.join(", ")));
        var pipeline = {};
        if (pipelineRaw.imageFirst !== undefined) {
            var b = toBool(pipelineRaw.imageFirst);
            if (b === null)
                throw new Error("pipeline.imageFirst must be boolean");
            pipeline.imageFirst = b;
        }
        if (pipelineRaw.answerAfterDiagnosis !== undefined) {
            var b = toBool(pipelineRaw.answerAfterDiagnosis);
            if (b === null)
                throw new Error("pipeline.answerAfterDiagnosis must be boolean");
            pipeline.answerAfterDiagnosis = b;
        }
        if (pipelineRaw.allowAnswerIfCnnFails !== undefined) {
            var b = toBool(pipelineRaw.allowAnswerIfCnnFails);
            if (b === null)
                throw new Error("pipeline.allowAnswerIfCnnFails must be boolean");
            pipeline.allowAnswerIfCnnFails = b;
        }
        if (pipelineRaw.lowConfidenceBehavior !== undefined) {
            var behavior = trimString(pipelineRaw.lowConfidenceBehavior, "pipeline.lowConfidenceBehavior").toLowerCase();
            if (behavior !== "warn" && behavior !== "ask_for_new_image" && behavior !== "block") {
                throw new Error("pipeline.lowConfidenceBehavior must be warn, ask_for_new_image, or block");
            }
            pipeline.lowConfidenceBehavior = behavior;
        }
        out.pipeline = pipeline;
    }
    if (payload.secrets !== undefined) {
        if (!payload.secrets || typeof payload.secrets !== "object" || Array.isArray(payload.secrets))
            throw new Error("secrets must be an object");
        var secretsRaw = payload.secrets;
        var secretsAllowed_1 = new Set(["openaiApiKey", "ragApiKey", "cnnApiKey"]);
        var secretsUnknown = Object.keys(secretsRaw).filter(function (k) { return !secretsAllowed_1.has(k); });
        if (secretsUnknown.length)
            throw new Error("Unknown secrets fields: ".concat(secretsUnknown.join(", ")));
        var secrets = {};
        if (secretsRaw.openaiApiKey !== undefined)
            secrets.openaiApiKey = trimString(secretsRaw.openaiApiKey, "secrets.openaiApiKey");
        if (secretsRaw.ragApiKey !== undefined)
            secrets.ragApiKey = trimString(secretsRaw.ragApiKey, "secrets.ragApiKey");
        if (secretsRaw.cnnApiKey !== undefined)
            secrets.cnnApiKey = trimString(secretsRaw.cnnApiKey, "secrets.cnnApiKey");
        out.secrets = secrets;
    }
    var merged = __assign(__assign({}, current), { cnn: __assign(__assign({}, current.cnn), (out.cnn || {})), rag: __assign(__assign({}, current.rag), (out.rag || {})), llm: __assign(__assign({}, current.llm), (out.llm || {})), fallback: __assign(__assign({}, current.fallback), (out.fallback || {})), features: __assign(__assign({}, current.features), (out.features || {})), pipeline: __assign(__assign({}, current.pipeline), (out.pipeline || {})), secrets: __assign(__assign({}, current.secrets), (out.secrets || {})) });
    if (merged.cnn.enabled) {
        if (!merged.cnn.provider.trim())
            throw new Error("cnn.provider is required when cnn.enabled is true");
        var hasPool = Array.isArray(merged.cnn.pool) && merged.cnn.pool.some(function (x) { return x.enabled && x.endpointUrl.trim(); });
        if (!hasPool) {
            if (!merged.cnn.endpointUrl.trim())
                throw new Error("cnn.endpointUrl is required when cnn.enabled is true");
            validateHttpUrl(merged.cnn.endpointUrl, "cnn.endpointUrl");
        }
    }
    if (merged.rag.enabled) {
        if (!merged.rag.endpointUrl.trim())
            throw new Error("rag.endpointUrl is required when rag.enabled is true");
        validateHttpUrl(merged.rag.endpointUrl, "rag.endpointUrl");
    }
    if (merged.llm.enabled && merged.llm.provider === "openai") {
        var hasPool = Array.isArray(merged.llm.pool) && merged.llm.pool.some(function (x) { return x.enabled && x.endpointUrl.trim() && x.model.trim(); });
        if (!hasPool && !merged.llm.model.trim())
            throw new Error("llm.model is required when llm is enabled");
    }
    return out;
};
var updateAiSettings = function (payload, updatedBy) { return __awaiter(void 0, void 0, void 0, function () {
    var current, sanitized, next;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.getAiSettings)()];
            case 1:
                current = _a.sent();
                sanitized = sanitizePayload(payload || {}, current);
                next = __assign(__assign({}, current), { cnn: __assign(__assign({}, current.cnn), (sanitized.cnn || {})), rag: __assign(__assign({}, current.rag), (sanitized.rag || {})), llm: __assign(__assign({}, current.llm), (sanitized.llm || {})), fallback: __assign(__assign({}, current.fallback), (sanitized.fallback || {})), features: __assign(__assign({}, current.features), (sanitized.features || {})), pipeline: __assign(__assign({}, current.pipeline), (sanitized.pipeline || {})), secrets: __assign(__assign({}, current.secrets), (sanitized.secrets || {})), updatedBy: updatedBy });
                return [4 /*yield*/, ai_settings_model_1.default.findOneAndUpdate({ key: "default" }, {
                        $set: __assign(__assign({}, next), { secrets: {
                                openaiApiKeyEnc: (0, secret_crypto_1.encryptSecret)(next.secrets.openaiApiKey || ""),
                                ragApiKeyEnc: (0, secret_crypto_1.encryptSecret)(next.secrets.ragApiKey || ""),
                                cnnApiKeyEnc: (0, secret_crypto_1.encryptSecret)(next.secrets.cnnApiKey || ""),
                            }, llm: __assign(__assign({}, next.llm), { pool: (next.llm.pool || []).map(function (p) { return ({
                                    name: p.name,
                                    enabled: p.enabled,
                                    providerType: p.providerType,
                                    endpointUrl: p.endpointUrl,
                                    model: p.model,
                                    taskRole: p.taskRole,
                                    timeoutMs: p.timeoutMs,
                                    apiKeyEnc: (0, secret_crypto_1.encryptSecret)(p.apiKey || ""),
                                }); }) }), cnn: __assign(__assign({}, next.cnn), { pool: (next.cnn.pool || []).map(function (p) { return ({
                                    name: p.name,
                                    enabled: p.enabled,
                                    endpointUrl: p.endpointUrl,
                                    timeoutMs: p.timeoutMs,
                                    apiKeyEnc: (0, secret_crypto_1.encryptSecret)(p.apiKey || ""),
                                }); }) }) }),
                    }, { upsert: true, new: true, runValidators: true })];
            case 2:
                _a.sent();
                // Invalidate cache so next request picks up the new settings
                _settingsCache = null;
                _settingsCacheTs = 0;
                return [2 /*return*/, (0, exports.getAiSettings)()];
        }
    });
}); };
exports.updateAiSettings = updateAiSettings;
var redactAiSettings = function (settings) { return (__assign(__assign({}, settings), { secrets: undefined, llm: __assign(__assign({}, settings.llm), { hasApiKey: Boolean(process.env.OPENAI_API_KEY || settings.secrets.openaiApiKey), pool: (settings.llm.pool || []).map(function (p) { return ({
            name: p.name,
            enabled: p.enabled,
            providerType: p.providerType,
            endpointUrl: p.endpointUrl,
            model: p.model,
            taskRole: p.taskRole,
            timeoutMs: p.timeoutMs,
            hasApiKey: Boolean(p.apiKey),
        }); }) }), rag: __assign(__assign({}, settings.rag), { hasApiKey: Boolean(settings.secrets.ragApiKey) }), cnn: __assign(__assign({}, settings.cnn), { hasApiKey: Boolean(settings.secrets.cnnApiKey), pool: (settings.cnn.pool || []).map(function (p) { return ({
            name: p.name,
            enabled: p.enabled,
            endpointUrl: p.endpointUrl,
            timeoutMs: p.timeoutMs,
            hasApiKey: Boolean(p.apiKey),
        }); }) }) })); };
exports.redactAiSettings = redactAiSettings;
