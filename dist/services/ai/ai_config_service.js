"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactAiSettings = exports.updateAiSettings = exports.getAiSettings = void 0;
const ai_settings_model_1 = __importDefault(require("../../models/ai_settings_model"));
const secret_crypto_1 = require("./secret_crypto");
const toNum = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};
const toBool = (value) => {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string") {
        const v = value.trim().toLowerCase();
        if (v === "true")
            return true;
        if (v === "false")
            return false;
    }
    return null;
};
const toValidNumber = (value, min, max, field) => {
    const n = typeof value === "string" ? Number(value.trim()) : Number(value);
    if (!Number.isFinite(n) || n < min || n > max) {
        throw new Error(`${field} must be between ${min} and ${max}`);
    }
    return n;
};
const trimString = (value, field) => {
    if (typeof value !== "string")
        throw new Error(`${field} must be a string`);
    return value.trim();
};
const validateHttpUrl = (value, field) => {
    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error(`${field} must be a valid http/https URL`);
        }
        return value;
    }
    catch {
        throw new Error(`${field} must be a valid http/https URL`);
    }
};
const dedupe = (arr) => {
    return Array.from(new Set(arr));
};
const normalizeStringArray = (raw, allowed, field) => {
    const allowedSet = new Set(allowed);
    const normalizedRaw = raw.map((x) => String(x).trim().toLowerCase());
    const invalid = normalizedRaw.filter((x) => !allowedSet.has(x));
    if (invalid.length) {
        throw new Error(`${field} can contain only ${allowed.join(" and ")}`);
    }
    return dedupe(normalizedRaw);
};
const envDefaults = () => ({
    key: "default",
    cnn: {
        enabled: true,
        provider: process.env.CNN_PROVIDER || "huggingface-space",
        endpointUrl: process.env.CNN_ENDPOINT_URL || "",
        timeoutMs: toNum(process.env.AI_CNN_TIMEOUT_MS, 35000),
        inputSize: toNum(process.env.CNN_INPUT_SIZE, 224),
        preprocessRequired: (process.env.CNN_PREPROCESS_REQUIRED || "false").toLowerCase() === "true",
        confidenceThreshold: toNum(process.env.CNN_CONFIDENCE_THRESHOLD, 0),
        pool: [],
    },
    rag: {
        enabled: true,
        endpointUrl: process.env.RAG_ENDPOINT_URL || "",
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
    fallback: {
        chatOrder: dedupe((process.env.AI_CHAT_FALLBACK_ORDER || "rag,llm").split(",").map((s) => s.trim()).filter((s) => s === "rag" || s === "llm")),
        diagnosisOrder: dedupe((process.env.AI_DIAGNOSIS_FALLBACK_ORDER || "cnn").split(",").map((s) => s.trim()).filter((s) => s === "cnn")),
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
});
const mergeSettings = (defaults, db) => {
    if (!db)
        return defaults;
    const plain = db.toObject ? db.toObject() : db;
    return {
        ...defaults,
        ...plain,
        cnn: {
            ...defaults.cnn,
            ...(plain.cnn || {}),
            pool: Array.isArray(plain?.cnn?.pool)
                ? plain.cnn.pool.map((p) => ({
                    name: String(p?.name || "").trim(),
                    enabled: p?.enabled !== false,
                    endpointUrl: String(p?.endpointUrl || "").trim(),
                    apiKey: (0, secret_crypto_1.decryptSecret)(String(p?.apiKeyEnc || "")),
                    timeoutMs: Number.isFinite(Number(p?.timeoutMs)) ? Number(p.timeoutMs) : undefined,
                }))
                : defaults.cnn.pool,
        },
        rag: { ...defaults.rag, ...(plain.rag || {}) },
        llm: {
            ...defaults.llm,
            ...(plain.llm || {}),
            pool: Array.isArray(plain?.llm?.pool)
                ? plain.llm.pool.map((p) => ({
                    name: String(p?.name || "").trim(),
                    enabled: p?.enabled !== false,
                    providerType: (["generic_llm", "openai_compatible", "anthropic", "gemini", "cohere", "huggingface_inference", "ollama"].includes(String(p?.providerType || "").toLowerCase())
                        ? String(p?.providerType || "").toLowerCase()
                        : "generic_llm"),
                    endpointUrl: String(p?.endpointUrl || "").trim(),
                    model: String(p?.model || "").trim(),
                    apiKey: (0, secret_crypto_1.decryptSecret)(String(p?.apiKeyEnc || "")),
                    timeoutMs: Number.isFinite(Number(p?.timeoutMs)) ? Number(p.timeoutMs) : undefined,
                }))
                : defaults.llm.pool,
        },
        fallback: { ...defaults.fallback, ...(plain.fallback || {}) },
        features: { ...defaults.features, ...(plain.features || {}) },
        pipeline: { ...defaults.pipeline, ...(plain.pipeline || {}) },
        secrets: {
            openaiApiKey: (0, secret_crypto_1.decryptSecret)(plain?.secrets?.openaiApiKeyEnc || ""),
            ragApiKey: (0, secret_crypto_1.decryptSecret)(plain?.secrets?.ragApiKeyEnc || ""),
            cnnApiKey: (0, secret_crypto_1.decryptSecret)(plain?.secrets?.cnnApiKeyEnc || ""),
        },
    };
};
const getAiSettings = async () => {
    const defaults = envDefaults();
    const stored = await ai_settings_model_1.default.findOne({ key: "default" });
    return mergeSettings(defaults, stored);
};
exports.getAiSettings = getAiSettings;
const assertAllowedTopKeys = (payload) => {
    const allowed = new Set(["cnn", "rag", "llm", "fallback", "features", "pipeline", "secrets"]);
    const disallowed = Object.keys(payload).filter((k) => !allowed.has(k));
    if (disallowed.length) {
        throw new Error(`Unknown fields are not allowed: ${disallowed.join(", ")}`);
    }
};
const sanitizePayload = (payload, current) => {
    assertAllowedTopKeys(payload);
    const out = {};
    if (payload.cnn !== undefined) {
        if (!payload.cnn || typeof payload.cnn !== "object" || Array.isArray(payload.cnn))
            throw new Error("cnn must be an object");
        const cnnRaw = payload.cnn;
        const cnnAllowed = new Set(["enabled", "provider", "endpointUrl", "timeoutMs", "inputSize", "preprocessRequired", "confidenceThreshold", "pool"]);
        const cnnUnknown = Object.keys(cnnRaw).filter((k) => !cnnAllowed.has(k));
        if (cnnUnknown.length)
            throw new Error(`Unknown cnn fields: ${cnnUnknown.join(", ")}`);
        const cnn = {};
        if (cnnRaw.enabled !== undefined) {
            const b = toBool(cnnRaw.enabled);
            if (b === null)
                throw new Error("cnn.enabled must be boolean");
            cnn.enabled = b;
        }
        if (cnnRaw.provider !== undefined) {
            const p = trimString(cnnRaw.provider, "cnn.provider");
            if (!p)
                throw new Error("cnn.provider must be non-empty");
            cnn.provider = p;
        }
        if (cnnRaw.endpointUrl !== undefined) {
            const endpoint = trimString(cnnRaw.endpointUrl, "cnn.endpointUrl");
            cnn.endpointUrl = endpoint;
        }
        if (cnnRaw.timeoutMs !== undefined)
            cnn.timeoutMs = toValidNumber(cnnRaw.timeoutMs, 1000, 120000, "cnn.timeoutMs");
        if (cnnRaw.inputSize !== undefined)
            cnn.inputSize = toValidNumber(cnnRaw.inputSize, 32, 4096, "cnn.inputSize");
        if (cnnRaw.preprocessRequired !== undefined) {
            const b = toBool(cnnRaw.preprocessRequired);
            if (b === null)
                throw new Error("cnn.preprocessRequired must be boolean");
            cnn.preprocessRequired = b;
        }
        if (cnnRaw.confidenceThreshold !== undefined)
            cnn.confidenceThreshold = toValidNumber(cnnRaw.confidenceThreshold, 0, 1, "cnn.confidenceThreshold");
        if (cnnRaw.pool !== undefined) {
            if (!Array.isArray(cnnRaw.pool))
                throw new Error("cnn.pool must be an array");
            cnn.pool = cnnRaw.pool.map((item, idx) => {
                if (!item || typeof item !== "object" || Array.isArray(item))
                    throw new Error(`cnn.pool[${idx}] must be an object`);
                const raw = item;
                const allowed = new Set(["name", "enabled", "endpointUrl", "apiKey", "timeoutMs"]);
                const unknown = Object.keys(raw).filter((k) => !allowed.has(k));
                if (unknown.length)
                    throw new Error(`Unknown cnn.pool fields at index ${idx}: ${unknown.join(", ")}`);
                const enabled = raw.enabled === undefined ? true : toBool(raw.enabled);
                if (enabled === null)
                    throw new Error(`cnn.pool[${idx}].enabled must be boolean`);
                const endpointUrl = trimString(raw.endpointUrl ?? "", `cnn.pool[${idx}].endpointUrl`);
                if (!endpointUrl)
                    throw new Error(`cnn.pool[${idx}].endpointUrl is required`);
                validateHttpUrl(endpointUrl, `cnn.pool[${idx}].endpointUrl`);
                const name = trimString(raw.name ?? `cnn-${idx + 1}`, `cnn.pool[${idx}].name`) || `cnn-${idx + 1}`;
                const apiKey = trimString(raw.apiKey ?? "", `cnn.pool[${idx}].apiKey`);
                const timeoutMs = raw.timeoutMs === undefined ? undefined : toValidNumber(raw.timeoutMs, 1000, 120000, `cnn.pool[${idx}].timeoutMs`);
                return { name, enabled, endpointUrl, apiKey, timeoutMs };
            });
        }
        out.cnn = cnn;
    }
    if (payload.rag !== undefined) {
        if (!payload.rag || typeof payload.rag !== "object" || Array.isArray(payload.rag))
            throw new Error("rag must be an object");
        const ragRaw = payload.rag;
        const ragAllowed = new Set(["enabled", "endpointUrl", "timeoutMs", "topK"]);
        const ragUnknown = Object.keys(ragRaw).filter((k) => !ragAllowed.has(k));
        if (ragUnknown.length)
            throw new Error(`Unknown rag fields: ${ragUnknown.join(", ")}`);
        const rag = {};
        if (ragRaw.enabled !== undefined) {
            const b = toBool(ragRaw.enabled);
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
        const llmRaw = payload.llm;
        const llmAllowed = new Set(["enabled", "provider", "model", "timeoutMs", "systemPrompt", "pool"]);
        const llmUnknown = Object.keys(llmRaw).filter((k) => !llmAllowed.has(k));
        if (llmUnknown.length)
            throw new Error(`Unknown llm fields: ${llmUnknown.join(", ")}`);
        const llm = {};
        if (llmRaw.enabled !== undefined) {
            const b = toBool(llmRaw.enabled);
            if (b === null)
                throw new Error("llm.enabled must be boolean");
            llm.enabled = b;
        }
        if (llmRaw.provider !== undefined) {
            const provider = trimString(llmRaw.provider, "llm.provider").toLowerCase();
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
            llm.pool = llmRaw.pool.map((item, idx) => {
                if (!item || typeof item !== "object" || Array.isArray(item))
                    throw new Error(`llm.pool[${idx}] must be an object`);
                const raw = item;
                const allowed = new Set(["name", "enabled", "providerType", "endpointUrl", "model", "apiKey", "timeoutMs"]);
                const unknown = Object.keys(raw).filter((k) => !allowed.has(k));
                if (unknown.length)
                    throw new Error(`Unknown llm.pool fields at index ${idx}: ${unknown.join(", ")}`);
                const enabled = raw.enabled === undefined ? true : toBool(raw.enabled);
                if (enabled === null)
                    throw new Error(`llm.pool[${idx}].enabled must be boolean`);
                const providerTypeRaw = trimString(raw.providerType ?? "generic_llm", `llm.pool[${idx}].providerType`).toLowerCase();
                if (providerTypeRaw !== "generic_llm" &&
                    providerTypeRaw !== "openai_compatible" &&
                    providerTypeRaw !== "anthropic" &&
                    providerTypeRaw !== "gemini" &&
                    providerTypeRaw !== "cohere" &&
                    providerTypeRaw !== "huggingface_inference" &&
                    providerTypeRaw !== "ollama") {
                    throw new Error("llm.pool[${idx}].providerType must be generic_llm, openai_compatible, anthropic, gemini, cohere, huggingface_inference, or ollama");
                }
                const endpointUrl = trimString(raw.endpointUrl ?? "", `llm.pool[${idx}].endpointUrl`);
                if (!endpointUrl)
                    throw new Error(`llm.pool[${idx}].endpointUrl is required`);
                validateHttpUrl(endpointUrl, `llm.pool[${idx}].endpointUrl`);
                const model = trimString(raw.model ?? "", `llm.pool[${idx}].model`);
                if (!model)
                    throw new Error(`llm.pool[${idx}].model is required`);
                const name = trimString(raw.name ?? `llm-${idx + 1}`, `llm.pool[${idx}].name`) || `llm-${idx + 1}`;
                const apiKey = trimString(raw.apiKey ?? "", `llm.pool[${idx}].apiKey`);
                const timeoutMs = raw.timeoutMs === undefined ? undefined : toValidNumber(raw.timeoutMs, 1000, 120000, `llm.pool[${idx}].timeoutMs`);
                return {
                    name,
                    enabled,
                    providerType: providerTypeRaw,
                    endpointUrl,
                    model,
                    apiKey,
                    timeoutMs,
                };
            });
        }
        out.llm = llm;
    }
    if (payload.fallback !== undefined) {
        if (!payload.fallback || typeof payload.fallback !== "object" || Array.isArray(payload.fallback))
            throw new Error("fallback must be an object");
        const fallbackRaw = payload.fallback;
        const fallbackAllowed = new Set(["chatOrder", "diagnosisOrder"]);
        const fallbackUnknown = Object.keys(fallbackRaw).filter((k) => !fallbackAllowed.has(k));
        if (fallbackUnknown.length)
            throw new Error(`Unknown fallback fields: ${fallbackUnknown.join(", ")}`);
        const fallback = {};
        if (fallbackRaw.chatOrder !== undefined) {
            if (!Array.isArray(fallbackRaw.chatOrder))
                throw new Error("fallback.chatOrder must be an array");
            const normalized = normalizeStringArray(fallbackRaw.chatOrder, ["rag", "llm"], "fallback.chatOrder");
            fallback.chatOrder = normalized;
        }
        if (fallbackRaw.diagnosisOrder !== undefined) {
            if (!Array.isArray(fallbackRaw.diagnosisOrder))
                throw new Error("fallback.diagnosisOrder must be an array");
            const normalized = normalizeStringArray(fallbackRaw.diagnosisOrder, ["cnn"], "fallback.diagnosisOrder");
            fallback.diagnosisOrder = normalized;
        }
        out.fallback = fallback;
    }
    if (payload.features !== undefined) {
        if (!payload.features || typeof payload.features !== "object" || Array.isArray(payload.features))
            throw new Error("features must be an object");
        const featuresRaw = payload.features;
        const featuresAllowed = new Set(["allowFlutterOfflineModel", "allowBackendFallbackToLLM"]);
        const featuresUnknown = Object.keys(featuresRaw).filter((k) => !featuresAllowed.has(k));
        if (featuresUnknown.length)
            throw new Error(`Unknown features fields: ${featuresUnknown.join(", ")}`);
        const features = {};
        if (featuresRaw.allowFlutterOfflineModel !== undefined) {
            const b = toBool(featuresRaw.allowFlutterOfflineModel);
            if (b === null)
                throw new Error("features.allowFlutterOfflineModel must be boolean");
            features.allowFlutterOfflineModel = b;
        }
        if (featuresRaw.allowBackendFallbackToLLM !== undefined) {
            const b = toBool(featuresRaw.allowBackendFallbackToLLM);
            if (b === null)
                throw new Error("features.allowBackendFallbackToLLM must be boolean");
            features.allowBackendFallbackToLLM = b;
        }
        out.features = features;
    }
    if (payload.pipeline !== undefined) {
        if (!payload.pipeline || typeof payload.pipeline !== "object" || Array.isArray(payload.pipeline))
            throw new Error("pipeline must be an object");
        const pipelineRaw = payload.pipeline;
        const pipelineAllowed = new Set(["imageFirst", "answerAfterDiagnosis", "allowAnswerIfCnnFails", "lowConfidenceBehavior"]);
        const pipelineUnknown = Object.keys(pipelineRaw).filter((k) => !pipelineAllowed.has(k));
        if (pipelineUnknown.length)
            throw new Error(`Unknown pipeline fields: ${pipelineUnknown.join(", ")}`);
        const pipeline = {};
        if (pipelineRaw.imageFirst !== undefined) {
            const b = toBool(pipelineRaw.imageFirst);
            if (b === null)
                throw new Error("pipeline.imageFirst must be boolean");
            pipeline.imageFirst = b;
        }
        if (pipelineRaw.answerAfterDiagnosis !== undefined) {
            const b = toBool(pipelineRaw.answerAfterDiagnosis);
            if (b === null)
                throw new Error("pipeline.answerAfterDiagnosis must be boolean");
            pipeline.answerAfterDiagnosis = b;
        }
        if (pipelineRaw.allowAnswerIfCnnFails !== undefined) {
            const b = toBool(pipelineRaw.allowAnswerIfCnnFails);
            if (b === null)
                throw new Error("pipeline.allowAnswerIfCnnFails must be boolean");
            pipeline.allowAnswerIfCnnFails = b;
        }
        if (pipelineRaw.lowConfidenceBehavior !== undefined) {
            const behavior = trimString(pipelineRaw.lowConfidenceBehavior, "pipeline.lowConfidenceBehavior").toLowerCase();
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
        const secretsRaw = payload.secrets;
        const secretsAllowed = new Set(["openaiApiKey", "ragApiKey", "cnnApiKey"]);
        const secretsUnknown = Object.keys(secretsRaw).filter((k) => !secretsAllowed.has(k));
        if (secretsUnknown.length)
            throw new Error(`Unknown secrets fields: ${secretsUnknown.join(", ")}`);
        const secrets = {};
        if (secretsRaw.openaiApiKey !== undefined)
            secrets.openaiApiKey = trimString(secretsRaw.openaiApiKey, "secrets.openaiApiKey");
        if (secretsRaw.ragApiKey !== undefined)
            secrets.ragApiKey = trimString(secretsRaw.ragApiKey, "secrets.ragApiKey");
        if (secretsRaw.cnnApiKey !== undefined)
            secrets.cnnApiKey = trimString(secretsRaw.cnnApiKey, "secrets.cnnApiKey");
        out.secrets = secrets;
    }
    const merged = {
        ...current,
        cnn: { ...current.cnn, ...(out.cnn || {}) },
        rag: { ...current.rag, ...(out.rag || {}) },
        llm: { ...current.llm, ...(out.llm || {}) },
        fallback: { ...current.fallback, ...(out.fallback || {}) },
        features: { ...current.features, ...(out.features || {}) },
        pipeline: { ...current.pipeline, ...(out.pipeline || {}) },
        secrets: { ...current.secrets, ...(out.secrets || {}) },
    };
    if (merged.cnn.enabled) {
        if (!merged.cnn.provider.trim())
            throw new Error("cnn.provider is required when cnn.enabled is true");
        const hasPool = Array.isArray(merged.cnn.pool) && merged.cnn.pool.some((x) => x.enabled && x.endpointUrl.trim());
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
        const hasPool = Array.isArray(merged.llm.pool) && merged.llm.pool.some((x) => x.enabled && x.endpointUrl.trim() && x.model.trim());
        if (!hasPool && !merged.llm.model.trim())
            throw new Error("llm.model is required when llm is enabled");
    }
    return out;
};
const updateAiSettings = async (payload, updatedBy) => {
    const current = await (0, exports.getAiSettings)();
    const sanitized = sanitizePayload(payload || {}, current);
    const next = {
        ...current,
        cnn: { ...current.cnn, ...(sanitized.cnn || {}) },
        rag: { ...current.rag, ...(sanitized.rag || {}) },
        llm: { ...current.llm, ...(sanitized.llm || {}) },
        fallback: { ...current.fallback, ...(sanitized.fallback || {}) },
        features: { ...current.features, ...(sanitized.features || {}) },
        pipeline: { ...current.pipeline, ...(sanitized.pipeline || {}) },
        secrets: { ...current.secrets, ...(sanitized.secrets || {}) },
        updatedBy,
    };
    await ai_settings_model_1.default.findOneAndUpdate({ key: "default" }, {
        $set: {
            ...next,
            secrets: {
                openaiApiKeyEnc: (0, secret_crypto_1.encryptSecret)(next.secrets.openaiApiKey || ""),
                ragApiKeyEnc: (0, secret_crypto_1.encryptSecret)(next.secrets.ragApiKey || ""),
                cnnApiKeyEnc: (0, secret_crypto_1.encryptSecret)(next.secrets.cnnApiKey || ""),
            },
            llm: {
                ...next.llm,
                pool: (next.llm.pool || []).map((p) => ({
                    name: p.name,
                    enabled: p.enabled,
                    providerType: p.providerType,
                    endpointUrl: p.endpointUrl,
                    model: p.model,
                    timeoutMs: p.timeoutMs,
                    apiKeyEnc: (0, secret_crypto_1.encryptSecret)(p.apiKey || ""),
                })),
            },
            cnn: {
                ...next.cnn,
                pool: (next.cnn.pool || []).map((p) => ({
                    name: p.name,
                    enabled: p.enabled,
                    endpointUrl: p.endpointUrl,
                    timeoutMs: p.timeoutMs,
                    apiKeyEnc: (0, secret_crypto_1.encryptSecret)(p.apiKey || ""),
                })),
            },
        },
    }, { upsert: true, new: true, runValidators: true });
    return (0, exports.getAiSettings)();
};
exports.updateAiSettings = updateAiSettings;
const redactAiSettings = (settings) => ({
    ...settings,
    secrets: undefined,
    llm: {
        ...settings.llm,
        hasApiKey: Boolean(process.env.OPENAI_API_KEY || settings.secrets.openaiApiKey),
        pool: (settings.llm.pool || []).map((p) => ({
            name: p.name,
            enabled: p.enabled,
            providerType: p.providerType,
            endpointUrl: p.endpointUrl,
            model: p.model,
            timeoutMs: p.timeoutMs,
            hasApiKey: Boolean(p.apiKey),
        })),
    },
    rag: {
        ...settings.rag,
        hasApiKey: Boolean(settings.secrets.ragApiKey),
    },
    cnn: {
        ...settings.cnn,
        hasApiKey: Boolean(settings.secrets.cnnApiKey),
        pool: (settings.cnn.pool || []).map((p) => ({
            name: p.name,
            enabled: p.enabled,
            endpointUrl: p.endpointUrl,
            timeoutMs: p.timeoutMs,
            hasApiKey: Boolean(p.apiKey),
        })),
    },
});
exports.redactAiSettings = redactAiSettings;
