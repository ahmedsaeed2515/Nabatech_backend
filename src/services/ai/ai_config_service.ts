import AiSettings, { IAiSettings } from "../../models/ai_settings_model";
import { decryptSecret, encryptSecret } from "./secret_crypto";

// ─── Settings Cache ───────────────────────────────────────────
let _settingsCache: AiSettingsShape | null = null;
let _settingsCacheTs = 0;
const SETTINGS_CACHE_TTL_MS = 60_000; // 1 minute
// ─────────────────────────────────────────────────────────────

export type AiSettingsShape = {
  key: string;
  cnn: {
    enabled: boolean;
    provider: string;
    endpointUrl: string;
    timeoutMs: number;
    inputSize: number;
    preprocessRequired: boolean;
    confidenceThreshold: number;
    pool: Array<{
      name: string;
      enabled: boolean;
      endpointUrl: string;
      apiKey: string;
      timeoutMs?: number;
    }>;
  };
  rag: {
    enabled: boolean;
    endpointUrl: string;
    timeoutMs: number;
    topK: number;
  };
  llm: {
    enabled: boolean;
    provider: "openai" | "disabled";
    model: string;
    timeoutMs: number;
    systemPrompt: string;
    pool: Array<{
      name: string;
      enabled: boolean;
      providerType: "generic_llm" | "openai_compatible" | "anthropic" | "gemini" | "cohere" | "huggingface_inference" | "ollama";
      endpointUrl: string;
      model: string;
      taskRole: "search" | "chat" | "both";
      apiKey: string;
      timeoutMs?: number;
    }>;
  };
  // ── HuggingFace RAG /ask used as last-resort LLM fallback ──────────────────
  ragFallback: {
    enabled: boolean;
    endpointUrl: string;   // Full URL to HF Space /ask endpoint
    timeoutMs: number;
  };
  // ─────────────────────────────────────────────────────────────────────────────
  fallback: {
    chatOrder: Array<"rag" | "llm">;
    diagnosisOrder: Array<"cnn">;
  };
  features: {
    allowFlutterOfflineModel: boolean;
    allowBackendFallbackToLLM: boolean;
  };
  pipeline: {
    imageFirst: boolean;
    answerAfterDiagnosis: boolean;
    allowAnswerIfCnnFails: boolean;
    lowConfidenceBehavior: "warn" | "ask_for_new_image" | "block";
  };
  secrets: {
    openaiApiKey: string;
    ragApiKey: string;
    cnnApiKey: string;
  };
  updatedBy?: string;
};

export type AiSettingsUpdatePayload = {
  cnn?: Partial<AiSettingsShape["cnn"]>;
  rag?: Partial<AiSettingsShape["rag"]>;
  llm?: Partial<AiSettingsShape["llm"]>;
  fallback?: Partial<AiSettingsShape["fallback"]>;
  features?: Partial<AiSettingsShape["features"]>;
  pipeline?: Partial<AiSettingsShape["pipeline"]>;
  secrets?: Partial<AiSettingsShape["secrets"]>;
};

const toNum = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return null;
};

const toValidNumber = (value: unknown, min: number, max: number, field: string): number => {
  const n = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${field} must be between ${min} and ${max}`);
  }
  return n;
};

const trimString = (value: unknown, field: string): string => {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  return value.trim();
};

const validateHttpUrl = (value: string, field: string): string => {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${field} must be a valid http/https URL`);
    }
    return value;
  } catch {
    throw new Error(`${field} must be a valid http/https URL`);
  }
};

const dedupe = <T extends string>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
};

const normalizeStringArray = <T extends string>(
  raw: unknown[],
  allowed: readonly T[],
  field: string
): T[] => {
  const allowedSet = new Set(allowed);
  const normalizedRaw = raw.map((x) => String(x).trim().toLowerCase());
  const invalid = normalizedRaw.filter((x) => !allowedSet.has(x as T));
  if (invalid.length) {
    throw new Error(`${field} can contain only ${allowed.join(" and ")}`);
  }
  return dedupe(normalizedRaw as T[]);
};

const envDefaults = (): AiSettingsShape => ({
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
    endpointUrl: (
      process.env.NEW_RAG_URL || process.env.CHAT_API_URL || process.env.RAG_ENDPOINT_URL || ""
    ).replace(/\/retrieve$/, "").replace(/\/$/, "") + "/ask",
    timeoutMs: toNum(process.env.RAG_FALLBACK_TIMEOUT_MS, 60000),
  },
  fallback: {
    chatOrder: dedupe((process.env.AI_CHAT_FALLBACK_ORDER || "rag,llm").split(",").map((s) => s.trim()).filter((s): s is "rag" | "llm" => s === "rag" || s === "llm")),
    diagnosisOrder: dedupe((process.env.AI_DIAGNOSIS_FALLBACK_ORDER || "cnn").split(",").map((s) => s.trim()).filter((s): s is "cnn" => s === "cnn")),
  },
  features: {
    allowFlutterOfflineModel: (process.env.AI_ALLOW_FLUTTER_OFFLINE_MODEL || "true").toLowerCase() === "true",
    allowBackendFallbackToLLM: (process.env.AI_ALLOW_BACKEND_FALLBACK_TO_LLM || "true").toLowerCase() === "true",
  },
  pipeline: {
    imageFirst: (process.env.AI_PIPELINE_IMAGE_FIRST || "true").toLowerCase() === "true",
    answerAfterDiagnosis: (process.env.AI_PIPELINE_ANSWER_AFTER_DIAGNOSIS || "true").toLowerCase() === "true",
    allowAnswerIfCnnFails: (process.env.AI_PIPELINE_ALLOW_ANSWER_IF_CNN_FAILS || "false").toLowerCase() === "true",
    lowConfidenceBehavior:
      (["warn", "ask_for_new_image", "block"].includes((process.env.AI_PIPELINE_LOW_CONFIDENCE_BEHAVIOR || "").toLowerCase())
        ? (process.env.AI_PIPELINE_LOW_CONFIDENCE_BEHAVIOR || "warn").toLowerCase()
        : "warn") as "warn" | "ask_for_new_image" | "block",
  },
  secrets: {
    openaiApiKey: "",
    ragApiKey: "",
    cnnApiKey: "",
  },
});

const mergeSettings = (defaults: AiSettingsShape, db: Partial<IAiSettings> | null): AiSettingsShape => {
  if (!db) return defaults;
  const plain = (db as any).toObject ? (db as any).toObject() : db;
  return {
    ...defaults,
    ...plain,
    cnn: {
      ...defaults.cnn,
      ...(plain.cnn || {}),
      pool: Array.isArray(plain?.cnn?.pool)
        ? plain.cnn.pool.map((p: any) => ({
            name: String(p?.name || "").trim(),
            enabled: p?.enabled !== false,
            endpointUrl: String(p?.endpointUrl || "").trim(),
            apiKey: decryptSecret(String(p?.apiKeyEnc || "")),
            timeoutMs: Number.isFinite(Number(p?.timeoutMs)) ? Number(p.timeoutMs) : undefined,
          }))
        : defaults.cnn.pool,
    },
    rag: { ...defaults.rag, ...(plain.rag || {}) },
    ragFallback: { ...defaults.ragFallback, ...(plain.ragFallback || {}) },
    llm: {
      ...defaults.llm,
      ...(plain.llm || {}),
      pool: Array.isArray(plain?.llm?.pool)
        ? plain.llm.pool.map((p: any) => ({
            name: String(p?.name || "").trim(),
            enabled: p?.enabled !== false,
            providerType: (["generic_llm", "openai_compatible", "anthropic", "gemini", "cohere", "huggingface_inference", "ollama"].includes(String(p?.providerType || "").toLowerCase())
              ? String(p?.providerType || "").toLowerCase()
              : "generic_llm") as "generic_llm" | "openai_compatible" | "anthropic" | "gemini" | "cohere" | "huggingface_inference" | "ollama",
            endpointUrl: String(p?.endpointUrl || "").trim(),
            model: String(p?.model || "").trim(),
            taskRole: (["search", "chat", "both"].includes(String(p?.taskRole || "").toLowerCase()) ? String(p?.taskRole || "").toLowerCase() : "both") as "search" | "chat" | "both",
            apiKey: decryptSecret(String(p?.apiKeyEnc || "")),
            timeoutMs: Number.isFinite(Number(p?.timeoutMs)) ? Number(p.timeoutMs) : undefined,
          }))
        : defaults.llm.pool,
    },
    fallback: { ...defaults.fallback, ...(plain.fallback || {}) },
    features: { ...defaults.features, ...(plain.features || {}) },
    pipeline: { ...defaults.pipeline, ...(plain.pipeline || {}) },
    secrets: {
      openaiApiKey: decryptSecret(plain?.secrets?.openaiApiKeyEnc || ""),
      ragApiKey: decryptSecret(plain?.secrets?.ragApiKeyEnc || ""),
      cnnApiKey: decryptSecret(plain?.secrets?.cnnApiKeyEnc || ""),
    },
  };
};

export const clearSettingsCache = () => {
  _settingsCache = null;
  _settingsCacheTs = 0;
};

export const getAiSettings = async (): Promise<AiSettingsShape> => {
  const now = Date.now();
  if (_settingsCache && now - _settingsCacheTs < SETTINGS_CACHE_TTL_MS) {
    return _settingsCache;
  }
  const defaults = envDefaults();
  const stored = await AiSettings.findOne({ key: "default" });
  let settings = mergeSettings(defaults, stored);

  try {
    const AiRoutingRule = (await import("../../models/ai_routing_rule_model")).default;

    // Fetch routing rules populated with model and provider
    const rules = await AiRoutingRule.find({ active: true })
      .populate({
        path: "primaryModel",
        populate: { path: "provider" }
      })
      .populate({
        path: "fallbackModels",
        populate: { path: "provider" }
      });

    const llmPool: any[] = [];
    const cnnPool: any[] = [];

    for (const rule of rules) {
      if (!rule.primaryModel) continue;
      const primary: any = rule.primaryModel;
      const provider: any = primary.provider;

      if (!provider) continue;

      if (rule.useCase === "diagnosis") {
        cnnPool.push({
          name: primary.displayName,
          enabled: true,
          endpointUrl: provider.baseUrl || "",
          apiKey: provider.apiKeyEnc ? decryptSecret(provider.apiKeyEnc) : "",
          timeoutMs: 60000
        });
      } else {
        llmPool.push({
          name: primary.displayName,
          enabled: true,
          providerType: provider.name === "openai" ? "openai_compatible" : "generic_llm",
          endpointUrl: provider.baseUrl || "",
          model: primary.modelId,
          taskRole: rule.useCase === "assistant" ? "chat" : "both",
          apiKey: provider.apiKeyEnc ? decryptSecret(provider.apiKeyEnc) : "",
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

  } catch (error) {
    console.warn("Failed to fetch dynamic AI routing rules, falling back to static config:", error);
  }

  _settingsCache = settings;
  _settingsCacheTs = now;
  return _settingsCache;
};

const assertAllowedTopKeys = (payload: Record<string, unknown>) => {
  const allowed = new Set(["cnn", "rag", "ragFallback", "llm", "fallback", "features", "pipeline", "secrets"]);
  const disallowed = Object.keys(payload).filter((k) => !allowed.has(k));
  if (disallowed.length) {
    throw new Error(`Unknown fields are not allowed: ${disallowed.join(", ")}`);
  }
};

const sanitizePayload = (payload: Record<string, unknown>, current: AiSettingsShape): AiSettingsUpdatePayload => {
  assertAllowedTopKeys(payload);
  const out: AiSettingsUpdatePayload = {};

  if (payload.cnn !== undefined) {
    if (!payload.cnn || typeof payload.cnn !== "object" || Array.isArray(payload.cnn)) throw new Error("cnn must be an object");
    const cnnRaw = payload.cnn as Record<string, unknown>;
    const cnnAllowed = new Set(["enabled", "provider", "endpointUrl", "timeoutMs", "inputSize", "preprocessRequired", "confidenceThreshold", "pool"]);
    const cnnUnknown = Object.keys(cnnRaw).filter((k) => !cnnAllowed.has(k));
    if (cnnUnknown.length) throw new Error(`Unknown cnn fields: ${cnnUnknown.join(", ")}`);

    const cnn: Partial<AiSettingsShape["cnn"]> = {};
    if (cnnRaw.enabled !== undefined) {
      const b = toBool(cnnRaw.enabled);
      if (b === null) throw new Error("cnn.enabled must be boolean");
      cnn.enabled = b;
    }
    if (cnnRaw.provider !== undefined) {
      const p = trimString(cnnRaw.provider, "cnn.provider");
      if (!p) throw new Error("cnn.provider must be non-empty");
      cnn.provider = p;
    }
    if (cnnRaw.endpointUrl !== undefined) {
      const endpoint = trimString(cnnRaw.endpointUrl, "cnn.endpointUrl");
      cnn.endpointUrl = endpoint;
    }
    if (cnnRaw.timeoutMs !== undefined) cnn.timeoutMs = toValidNumber(cnnRaw.timeoutMs, 1000, 120000, "cnn.timeoutMs");
    if (cnnRaw.inputSize !== undefined) cnn.inputSize = toValidNumber(cnnRaw.inputSize, 32, 4096, "cnn.inputSize");
    if (cnnRaw.preprocessRequired !== undefined) {
      const b = toBool(cnnRaw.preprocessRequired);
      if (b === null) throw new Error("cnn.preprocessRequired must be boolean");
      cnn.preprocessRequired = b;
    }
    if (cnnRaw.confidenceThreshold !== undefined) cnn.confidenceThreshold = toValidNumber(cnnRaw.confidenceThreshold, 0, 1, "cnn.confidenceThreshold");
    if (cnnRaw.pool !== undefined) {
      if (!Array.isArray(cnnRaw.pool)) throw new Error("cnn.pool must be an array");
      cnn.pool = cnnRaw.pool.map((item, idx) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`cnn.pool[${idx}] must be an object`);
        const raw = item as Record<string, unknown>;
        const allowed = new Set(["name", "enabled", "endpointUrl", "apiKey", "timeoutMs"]);
        const unknown = Object.keys(raw).filter((k) => !allowed.has(k));
        if (unknown.length) throw new Error(`Unknown cnn.pool fields at index ${idx}: ${unknown.join(", ")}`);
        const enabled = raw.enabled === undefined ? true : toBool(raw.enabled);
        if (enabled === null) throw new Error(`cnn.pool[${idx}].enabled must be boolean`);
        const endpointUrl = trimString(raw.endpointUrl ?? "", `cnn.pool[${idx}].endpointUrl`);
        if (!endpointUrl) throw new Error(`cnn.pool[${idx}].endpointUrl is required`);
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
    if (!payload.rag || typeof payload.rag !== "object" || Array.isArray(payload.rag)) throw new Error("rag must be an object");
    const ragRaw = payload.rag as Record<string, unknown>;
    const ragAllowed = new Set(["enabled", "endpointUrl", "timeoutMs", "topK"]);
    const ragUnknown = Object.keys(ragRaw).filter((k) => !ragAllowed.has(k));
    if (ragUnknown.length) throw new Error(`Unknown rag fields: ${ragUnknown.join(", ")}`);

    const rag: Partial<AiSettingsShape["rag"]> = {};
    if (ragRaw.enabled !== undefined) {
      const b = toBool(ragRaw.enabled);
      if (b === null) throw new Error("rag.enabled must be boolean");
      rag.enabled = b;
    }
    if (ragRaw.endpointUrl !== undefined) rag.endpointUrl = trimString(ragRaw.endpointUrl, "rag.endpointUrl");
    if (ragRaw.timeoutMs !== undefined) rag.timeoutMs = toValidNumber(ragRaw.timeoutMs, 1000, 120000, "rag.timeoutMs");
    if (ragRaw.topK !== undefined) rag.topK = toValidNumber(ragRaw.topK, 1, 100, "rag.topK");

    out.rag = rag;
  }

  if (payload.llm !== undefined) {
    if (!payload.llm || typeof payload.llm !== "object" || Array.isArray(payload.llm)) throw new Error("llm must be an object");
    const llmRaw = payload.llm as Record<string, unknown>;
    const llmAllowed = new Set(["enabled", "provider", "model", "timeoutMs", "systemPrompt", "pool"]);
    const llmUnknown = Object.keys(llmRaw).filter((k) => !llmAllowed.has(k));
    if (llmUnknown.length) throw new Error(`Unknown llm fields: ${llmUnknown.join(", ")}`);

    const llm: Partial<AiSettingsShape["llm"]> = {};
    if (llmRaw.enabled !== undefined) {
      const b = toBool(llmRaw.enabled);
      if (b === null) throw new Error("llm.enabled must be boolean");
      llm.enabled = b;
    }
    if (llmRaw.provider !== undefined) {
      const provider = trimString(llmRaw.provider, "llm.provider").toLowerCase();
      if (provider !== "openai" && provider !== "disabled") throw new Error("llm.provider must be openai or disabled");
      llm.provider = provider as "openai" | "disabled";
    }
    if (llmRaw.model !== undefined) llm.model = trimString(llmRaw.model, "llm.model");
    if (llmRaw.timeoutMs !== undefined) llm.timeoutMs = toValidNumber(llmRaw.timeoutMs, 1000, 120000, "llm.timeoutMs");
    if (llmRaw.systemPrompt !== undefined) llm.systemPrompt = trimString(llmRaw.systemPrompt, "llm.systemPrompt");
    if (llmRaw.pool !== undefined) {
      if (!Array.isArray(llmRaw.pool)) throw new Error("llm.pool must be an array");
      llm.pool = llmRaw.pool.map((item, idx) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`llm.pool[${idx}] must be an object`);
        const raw = item as Record<string, unknown>;
        const allowed = new Set(["name", "enabled", "providerType", "endpointUrl", "model", "taskRole", "apiKey", "timeoutMs"]);
        const unknown = Object.keys(raw).filter((k) => !allowed.has(k));
        if (unknown.length) throw new Error(`Unknown llm.pool fields at index ${idx}: ${unknown.join(", ")}`);
        const enabled = raw.enabled === undefined ? true : toBool(raw.enabled);
        if (enabled === null) throw new Error(`llm.pool[${idx}].enabled must be boolean`);
        const providerTypeRaw = trimString(raw.providerType ?? "generic_llm", `llm.pool[${idx}].providerType`).toLowerCase();
        if (
          providerTypeRaw !== "generic_llm" &&
          providerTypeRaw !== "openai_compatible" &&
          providerTypeRaw !== "anthropic" &&
          providerTypeRaw !== "gemini" &&
          providerTypeRaw !== "cohere" &&
          providerTypeRaw !== "huggingface_inference" &&
          providerTypeRaw !== "ollama"
        ) {
          throw new Error("llm.pool[${idx}].providerType must be generic_llm, openai_compatible, anthropic, gemini, cohere, huggingface_inference, or ollama");
        }
        const endpointUrl = trimString(raw.endpointUrl ?? "", `llm.pool[${idx}].endpointUrl`);
        if (!endpointUrl) throw new Error(`llm.pool[${idx}].endpointUrl is required`);
        validateHttpUrl(endpointUrl, `llm.pool[${idx}].endpointUrl`);
        const model = trimString(raw.model ?? "", `llm.pool[${idx}].model`);
        if (!model) throw new Error(`llm.pool[${idx}].model is required`);
        const name = trimString(raw.name ?? `llm-${idx + 1}`, `llm.pool[${idx}].name`) || `llm-${idx + 1}`;
        const apiKey = trimString(raw.apiKey ?? "", `llm.pool[${idx}].apiKey`);
        const timeoutMs = raw.timeoutMs === undefined ? undefined : toValidNumber(raw.timeoutMs, 1000, 120000, `llm.pool[${idx}].timeoutMs`);
        const taskRoleRaw = trimString(raw.taskRole ?? "both", `llm.pool[${idx}].taskRole`).toLowerCase();
        if (taskRoleRaw !== "search" && taskRoleRaw !== "chat" && taskRoleRaw !== "both") {
          throw new Error(`llm.pool[${idx}].taskRole must be search, chat, or both`);
        }
        return {
          name,
          enabled,
          providerType: providerTypeRaw as "generic_llm" | "openai_compatible" | "anthropic" | "gemini" | "cohere" | "huggingface_inference" | "ollama",
          endpointUrl,
          model,
          taskRole: taskRoleRaw as "search" | "chat" | "both",
          apiKey,
          timeoutMs,
        };
      });
    }

    out.llm = llm;
  }

  if (payload.fallback !== undefined) {
    if (!payload.fallback || typeof payload.fallback !== "object" || Array.isArray(payload.fallback)) throw new Error("fallback must be an object");
    const fallbackRaw = payload.fallback as Record<string, unknown>;
    const fallbackAllowed = new Set(["chatOrder", "diagnosisOrder"]);
    const fallbackUnknown = Object.keys(fallbackRaw).filter((k) => !fallbackAllowed.has(k));
    if (fallbackUnknown.length) throw new Error(`Unknown fallback fields: ${fallbackUnknown.join(", ")}`);

    const fallback: Partial<AiSettingsShape["fallback"]> = {};
    if (fallbackRaw.chatOrder !== undefined) {
      if (!Array.isArray(fallbackRaw.chatOrder)) throw new Error("fallback.chatOrder must be an array");
      const normalized = normalizeStringArray(fallbackRaw.chatOrder, ["rag", "llm"], "fallback.chatOrder");
      fallback.chatOrder = normalized;
    }
    if (fallbackRaw.diagnosisOrder !== undefined) {
      if (!Array.isArray(fallbackRaw.diagnosisOrder)) throw new Error("fallback.diagnosisOrder must be an array");
      const normalized = normalizeStringArray(fallbackRaw.diagnosisOrder, ["cnn"], "fallback.diagnosisOrder");
      fallback.diagnosisOrder = normalized;
    }
    out.fallback = fallback;
  }

  if (payload.features !== undefined) {
    if (!payload.features || typeof payload.features !== "object" || Array.isArray(payload.features)) throw new Error("features must be an object");
    const featuresRaw = payload.features as Record<string, unknown>;
    const featuresAllowed = new Set(["allowFlutterOfflineModel", "allowBackendFallbackToLLM"]);
    const featuresUnknown = Object.keys(featuresRaw).filter((k) => !featuresAllowed.has(k));
    if (featuresUnknown.length) throw new Error(`Unknown features fields: ${featuresUnknown.join(", ")}`);

    const features: Partial<AiSettingsShape["features"]> = {};
    if (featuresRaw.allowFlutterOfflineModel !== undefined) {
      const b = toBool(featuresRaw.allowFlutterOfflineModel);
      if (b === null) throw new Error("features.allowFlutterOfflineModel must be boolean");
      features.allowFlutterOfflineModel = b;
    }
    if (featuresRaw.allowBackendFallbackToLLM !== undefined) {
      const b = toBool(featuresRaw.allowBackendFallbackToLLM);
      if (b === null) throw new Error("features.allowBackendFallbackToLLM must be boolean");
      features.allowBackendFallbackToLLM = b;
    }
    out.features = features;
  }
  if (payload.pipeline !== undefined) {
    if (!payload.pipeline || typeof payload.pipeline !== "object" || Array.isArray(payload.pipeline)) throw new Error("pipeline must be an object");
    const pipelineRaw = payload.pipeline as Record<string, unknown>;
    const pipelineAllowed = new Set(["imageFirst", "answerAfterDiagnosis", "allowAnswerIfCnnFails", "lowConfidenceBehavior"]);
    const pipelineUnknown = Object.keys(pipelineRaw).filter((k) => !pipelineAllowed.has(k));
    if (pipelineUnknown.length) throw new Error(`Unknown pipeline fields: ${pipelineUnknown.join(", ")}`);

    const pipeline: Partial<AiSettingsShape["pipeline"]> = {};
    if (pipelineRaw.imageFirst !== undefined) {
      const b = toBool(pipelineRaw.imageFirst);
      if (b === null) throw new Error("pipeline.imageFirst must be boolean");
      pipeline.imageFirst = b;
    }
    if (pipelineRaw.answerAfterDiagnosis !== undefined) {
      const b = toBool(pipelineRaw.answerAfterDiagnosis);
      if (b === null) throw new Error("pipeline.answerAfterDiagnosis must be boolean");
      pipeline.answerAfterDiagnosis = b;
    }
    if (pipelineRaw.allowAnswerIfCnnFails !== undefined) {
      const b = toBool(pipelineRaw.allowAnswerIfCnnFails);
      if (b === null) throw new Error("pipeline.allowAnswerIfCnnFails must be boolean");
      pipeline.allowAnswerIfCnnFails = b;
    }
    if (pipelineRaw.lowConfidenceBehavior !== undefined) {
      const behavior = trimString(pipelineRaw.lowConfidenceBehavior, "pipeline.lowConfidenceBehavior").toLowerCase();
      if (behavior !== "warn" && behavior !== "ask_for_new_image" && behavior !== "block") {
        throw new Error("pipeline.lowConfidenceBehavior must be warn, ask_for_new_image, or block");
      }
      pipeline.lowConfidenceBehavior = behavior as "warn" | "ask_for_new_image" | "block";
    }
    out.pipeline = pipeline;
  }

  if (payload.secrets !== undefined) {
    if (!payload.secrets || typeof payload.secrets !== "object" || Array.isArray(payload.secrets)) throw new Error("secrets must be an object");
    const secretsRaw = payload.secrets as Record<string, unknown>;
    const secretsAllowed = new Set(["openaiApiKey", "ragApiKey", "cnnApiKey"]);
    const secretsUnknown = Object.keys(secretsRaw).filter((k) => !secretsAllowed.has(k));
    if (secretsUnknown.length) throw new Error(`Unknown secrets fields: ${secretsUnknown.join(", ")}`);

    const secrets: Partial<AiSettingsShape["secrets"]> = {};
    if (secretsRaw.openaiApiKey !== undefined) secrets.openaiApiKey = trimString(secretsRaw.openaiApiKey, "secrets.openaiApiKey");
    if (secretsRaw.ragApiKey !== undefined) secrets.ragApiKey = trimString(secretsRaw.ragApiKey, "secrets.ragApiKey");
    if (secretsRaw.cnnApiKey !== undefined) secrets.cnnApiKey = trimString(secretsRaw.cnnApiKey, "secrets.cnnApiKey");
    out.secrets = secrets;
  }

  const merged: AiSettingsShape = {
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
    if (!merged.cnn.provider.trim()) throw new Error("cnn.provider is required when cnn.enabled is true");
    const hasPool = Array.isArray(merged.cnn.pool) && merged.cnn.pool.some((x) => x.enabled && x.endpointUrl.trim());
    if (!hasPool) {
      if (!merged.cnn.endpointUrl.trim()) throw new Error("cnn.endpointUrl is required when cnn.enabled is true");
      validateHttpUrl(merged.cnn.endpointUrl, "cnn.endpointUrl");
    }
  }

  if (merged.rag.enabled) {
    if (!merged.rag.endpointUrl.trim()) throw new Error("rag.endpointUrl is required when rag.enabled is true");
    validateHttpUrl(merged.rag.endpointUrl, "rag.endpointUrl");
  }

  if (merged.llm.enabled && merged.llm.provider === "openai") {
    const hasPool = Array.isArray(merged.llm.pool) && merged.llm.pool.some((x) => x.enabled && x.endpointUrl.trim() && x.model.trim());
    if (!hasPool && !merged.llm.model.trim()) throw new Error("llm.model is required when llm is enabled");
  }

  return out;
};

export const updateAiSettings = async (payload: Record<string, unknown>, updatedBy?: string): Promise<AiSettingsShape> => {
  const current = await getAiSettings();
  const sanitized = sanitizePayload(payload || {}, current);

  const next: AiSettingsShape = {
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

  await AiSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        ...next,
        secrets: {
          openaiApiKeyEnc: encryptSecret(next.secrets.openaiApiKey || ""),
          ragApiKeyEnc: encryptSecret(next.secrets.ragApiKey || ""),
          cnnApiKeyEnc: encryptSecret(next.secrets.cnnApiKey || ""),
        },
        llm: {
          ...next.llm,
          pool: (next.llm.pool || []).map((p) => ({
            name: p.name,
            enabled: p.enabled,
            providerType: p.providerType,
            endpointUrl: p.endpointUrl,
            model: p.model,
            taskRole: p.taskRole,
            timeoutMs: p.timeoutMs,
            apiKeyEnc: encryptSecret(p.apiKey || ""),
          })),
        },
        cnn: {
          ...next.cnn,
          pool: (next.cnn.pool || []).map((p) => ({
            name: p.name,
            enabled: p.enabled,
            endpointUrl: p.endpointUrl,
            timeoutMs: p.timeoutMs,
            apiKeyEnc: encryptSecret(p.apiKey || ""),
          })),
        },
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // Invalidate cache so next request picks up the new settings
  _settingsCache = null;
  _settingsCacheTs = 0;

  return getAiSettings();
};

export const redactAiSettings = (settings: AiSettingsShape) => ({
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
      taskRole: p.taskRole,
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

