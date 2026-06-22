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
exports.getProviderManager = void 0;
const axios_1 = __importDefault(require("axios"));
const ai_provider_settings_model_1 = __importDefault(require("../../models/ai_provider_settings_model"));
const secret_crypto_1 = require("./secret_crypto");
const logger_1 = require("../../utils/logger");
const llm_provider_1 = require("./llm_provider");
const ai_errors_1 = require("./ai_errors");
// Global interceptor for agentrouter.org requirements
axios_1.default.interceptors.request.use((config) => {
    if (config.url && config.url.includes("agentrouter.org")) {
        if (!config.headers)
            config.headers = {};
        config.headers["HTTP-Referer"] = "https://agentrouter.org/";
        config.headers["X-Title"] = "MyApp";
    }
    return config;
});
class AiProviderManager {
    constructor() {
        this.providers = [];
        this.lastReloadAt = 0;
        this.RELOAD_TTL_MS = 30000; // refresh from DB every 30s
    }
    async reloadProviders() {
        this.providers = await ai_provider_settings_model_1.default.find({ enabled: true }).sort({ priority: 1 });
        this.lastReloadAt = Date.now();
    }
    getProviders() {
        return this.providers;
    }
    determineProviderType(url, providerName) {
        const p = providerName.toLowerCase();
        if (p.includes('gemini') || url.includes('generativelanguage.googleapis'))
            return 'gemini';
        if (p.includes('anthropic'))
            return 'anthropic';
        if (p.includes('cohere'))
            return 'cohere';
        if (p.includes('openrouter'))
            return 'generic_llm';
        if (p.includes('groq') || url.includes('api.groq.com'))
            return 'generic_llm';
        if (p.includes('openai') || url.includes('api.openai.com'))
            return 'generic_llm';
        if (url.includes('router.huggingface.co'))
            return 'generic_llm';
        if (url.includes('hf.space') || p.includes('huggingface'))
            return 'huggingface_inference';
        return 'generic_llm';
    }
    async executeWithFailover(systemPrompt, message, history, options = {}) {
        // Always reload if cache is empty or stale (TTL expired)
        const now = Date.now();
        if (this.providers.length === 0 || (now - this.lastReloadAt) > this.RELOAD_TTL_MS) {
            await this.reloadProviders();
        }
        if (this.providers.length === 0) {
            throw new ai_errors_1.AiProviderError("No active AI providers configured in the database.");
        }
        const errors = [];
        // Sort providers: prefer fewer consecutive errors, then by priority
        const sortedProviders = [...this.providers].sort((a, b) => {
            const errA = this.consecutiveErrors?.[a.providerName] || 0;
            const errB = this.consecutiveErrors?.[b.providerName] || 0;
            if (errA !== errB)
                return errA - errB;
            return a.priority - b.priority;
        });
        for (const provider of sortedProviders) {
            logger_1.logger.info(`Attempting LLM call via ${provider.providerName} (${provider.llmModel})`);
            const apiKey = (0, secret_crypto_1.decryptSecret)(provider.apiKeyEncrypted);
            const providerType = this.determineProviderType(provider.baseUrl, provider.providerName);
            try {
                const startTime = Date.now();
                const content = await (0, llm_provider_1.callProvider)({
                    providerType,
                    endpointUrl: provider.baseUrl,
                    model: provider.llmModel,
                    apiKey,
                    timeoutMs: options.timeoutMs || 25000,
                    systemPrompt,
                    message,
                    history,
                });
                // On success, reset consecutive errors
                this.consecutiveErrors = this.consecutiveErrors || {};
                this.consecutiveErrors[provider.providerName] = 0;
                // Update health on success asynchronously
                this.updateHealth(provider._id.toString(), "healthy", "");
                return {
                    message: content,
                    source: "llm",
                    provider: provider.providerName,
                    model: provider.llmModel,
                };
            }
            catch (err) {
                logger_1.logger.warn(`Provider ${provider.providerName} failed: ${err.message}`);
                errors.push({ provider: provider.providerName, error: err.message });
                // Track consecutive errors
                this.consecutiveErrors = this.consecutiveErrors || {};
                this.consecutiveErrors[provider.providerName] = (this.consecutiveErrors[provider.providerName] || 0) + 1;
                // Update health on failure
                this.updateHealth(provider._id.toString(), "failed", err.message);
                // Continue to next priority provider
            }
        }
        // If all DB providers failed, try emergency fallback if configured
        try {
            const { askRagFallback } = await Promise.resolve().then(() => __importStar(require("./llm_provider")));
            // Use the fallback HF space endpoint
            const fallbackResult = await askRagFallback("https://ahmedsaeed111-rag-only.hf.space/ask", message, history);
            return { message: fallbackResult, source: "hf-rag-fallback", provider: "hf-rag-fallback", model: "Qwen/Qwen2.5-72B-Instruct" };
        }
        catch (fallbackErr) {
            logger_1.logger.error("Emergency fallback also failed: " + (fallbackErr?.message || String(fallbackErr)));
            // Safely serialize errors — avoid circular reference from axios error objects
            const safeErrors = errors.map((e) => ({ provider: e.provider, error: String(e.error) }));
            throw new ai_errors_1.AiProviderError(`All AI providers failed. Errors: ${JSON.stringify(safeErrors)}`);
        }
    }
    async updateHealth(id, status, errorMsg) {
        try {
            await ai_provider_settings_model_1.default.findByIdAndUpdate(id, {
                status,
                lastHealthCheck: new Date(),
                lastError: errorMsg.substring(0, 500)
            });
        }
        catch (e) {
            logger_1.logger.error("Failed to update provider health", e);
        }
    }
    async checkAllHealth() {
        await this.reloadProviders();
        const results = [];
        for (const provider of this.providers) {
            const res = await this.testSingleProvider(provider);
            results.push(res);
        }
        return results;
    }
    async testSingleProvider(provider) {
        try {
            const apiKey = (0, secret_crypto_1.decryptSecret)(provider.apiKeyEncrypted);
            const providerType = this.determineProviderType(provider.baseUrl, provider.providerName);
            await (0, llm_provider_1.callProvider)({
                providerType,
                endpointUrl: provider.baseUrl,
                model: provider.llmModel,
                apiKey,
                timeoutMs: 10000,
                systemPrompt: "You are a helpful assistant.",
                message: "Reply with the exact word 'OK'",
                history: [],
            });
            await this.updateHealth(provider._id.toString(), "healthy", "");
            return { providerName: provider.providerName, status: "healthy", error: null };
        }
        catch (e) {
            await this.updateHealth(provider._id.toString(), "failed", e.message);
            return { providerName: provider.providerName, status: "failed", error: e.message };
        }
    }
}
// Singleton pattern
let managerInstance;
const getProviderManager = () => {
    if (!managerInstance) {
        managerInstance = new AiProviderManager();
    }
    return managerInstance;
};
exports.getProviderManager = getProviderManager;
