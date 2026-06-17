"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCnnDiagnosis = void 0;
const axios_1 = __importDefault(require("axios"));
const ai_errors_1 = require("./ai_errors");
const normalizeConfidence = (raw) => {
    if (raw === null || raw === undefined)
        return undefined;
    const num = Number(raw);
    if (!Number.isFinite(num))
        return undefined;
    if (num > 1)
        return Math.max(0, Math.min(1, num / 100));
    return Math.max(0, Math.min(1, num));
};
const runCnnDiagnosis = async (settings, formData, headers) => {
    if (!settings.cnn.enabled || !settings.cnn.endpointUrl) {
        throw new ai_errors_1.AiProviderError("CNN provider disabled or not configured", {
            code: "CNN_NOT_CONFIGURED",
            isUpstream: false,
        });
    }
    const candidatesList = settings.cnn.pool && settings.cnn.pool.length
        ? settings.cnn.pool.filter((p) => p.enabled)
        : [
            {
                name: settings.cnn.provider,
                endpointUrl: settings.cnn.endpointUrl,
                timeoutMs: settings.cnn.timeoutMs,
                apiKey: settings.secrets.cnnApiKey || "",
            },
        ];
    let lastError;
    for (const candidate of candidatesList) {
        const cnnApiKey = (candidate.apiKey || "").trim();
        const outboundHeaders = {
            ...headers,
            ...(cnnApiKey ? { Authorization: `Bearer ${cnnApiKey}` } : {}),
        };
        const maxRetries = 2;
        const timeoutMs = Math.min(candidate.timeoutMs || settings.cnn.timeoutMs || 5000, 5000);
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios_1.default.post(candidate.endpointUrl, formData, {
                    headers: outboundHeaders,
                    timeout: timeoutMs,
                });
                const data = (response.data || {});
                const prediction = (data.prediction || data.label || data.class || "").toString().trim();
                if (!prediction) {
                    lastError = new ai_errors_1.AiProviderError(`No prediction label returned from ${candidate.name}`, {
                        code: "CNN_EMPTY_PREDICTION",
                    });
                    break; // Don't retry if the endpoint responded but payload is bad
                }
                const confidence = normalizeConfidence(data.confidence ?? data.score ?? data.probability);
                const rawCandidates = Array.isArray(data.candidates) ? data.candidates : [];
                const outCandidates = rawCandidates
                    .map((x) => ({ label: String(x.label || x.class || x.prediction || "").trim(), confidence: normalizeConfidence(x.confidence ?? x.score ?? x.probability) }))
                    .filter((x) => x.label);
                return {
                    prediction,
                    confidence,
                    candidates: outCandidates,
                    provider: candidate.name || settings.cnn.provider,
                };
            }
            catch (error) {
                lastError = (0, ai_errors_1.toProviderError)(error, `CNN provider request failed (${candidate.name}) - attempt ${attempt + 1}`, "CNN_UPSTREAM_FAILED");
                const status = error.response?.status;
                const isNetworkError = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
                if (attempt < maxRetries && (isNetworkError || status === 502 || status === 503 || status === 504)) {
                    // Wait briefly before retrying
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                break; // Stop retrying on 4xx errors or if max retries reached
            }
        }
    }
    throw lastError instanceof Error ? lastError : new ai_errors_1.AiProviderError("No CNN provider succeeded", { code: "CNN_ALL_FAILED" });
};
exports.runCnnDiagnosis = runCnnDiagnosis;
