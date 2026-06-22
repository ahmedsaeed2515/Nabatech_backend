"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.testProvider = exports.checkHealth = exports.updateProvider = exports.createProvider = exports.getProviders = void 0;
const ai_provider_settings_model_1 = __importDefault(require("../models/ai_provider_settings_model"));
const secret_crypto_1 = require("../services/ai/secret_crypto");
const api_response_1 = require("../utils/api_response");
const ai_provider_manager_1 = require("../services/ai/ai_provider_manager");
const ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
const ai_config_service_1 = require("../services/ai/ai_config_service");
const getProviders = async (req, res, next) => {
    try {
        const providers = await ai_provider_settings_model_1.default.find().sort({ priority: 1 });
        const safeProviders = providers.map((p) => {
            const obj = p.toObject();
            // Mask API key for security
            if (obj.apiKeyEncrypted) {
                obj.hasApiKey = true;
            }
            else {
                obj.hasApiKey = false;
            }
            delete obj.apiKeyEncrypted;
            return obj;
        });
        return (0, api_response_1.ok)(res, { providers: safeProviders });
    }
    catch (error) {
        next(error);
    }
};
exports.getProviders = getProviders;
const createProvider = async (req, res, next) => {
    try {
        const { providerName, enabled, priority, defaultProvider, apiKey, llmModel, baseUrl } = req.body;
        // If setting as default, unset others
        if (defaultProvider) {
            await ai_provider_settings_model_1.default.updateMany({}, { defaultProvider: false });
        }
        const provider = await ai_provider_settings_model_1.default.create({
            providerName,
            enabled: enabled ?? false,
            priority: priority ?? 99,
            defaultProvider: defaultProvider ?? false,
            apiKeyEncrypted: apiKey ? (0, secret_crypto_1.encryptSecret)(apiKey) : "",
            llmModel,
            baseUrl,
            status: "unknown"
        });
        // Clear settings cache
        (0, ai_config_service_1.clearSettingsCache)();
        // Reload provider manager
        const manager = (0, ai_provider_manager_1.getProviderManager)();
        await manager.reloadProviders();
        return (0, api_response_1.ok)(res, { provider: { id: provider._id, providerName: provider.providerName } });
    }
    catch (error) {
        next(error);
    }
};
exports.createProvider = createProvider;
const updateProvider = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { enabled, priority, defaultProvider, apiKey, llmModel, baseUrl } = req.body;
        const provider = await ai_provider_settings_model_1.default.findById(id);
        if (!provider) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }
        if (defaultProvider) {
            await ai_provider_settings_model_1.default.updateMany({ _id: { $ne: id } }, { defaultProvider: false });
        }
        if (enabled !== undefined)
            provider.enabled = enabled;
        if (priority !== undefined)
            provider.priority = priority;
        if (defaultProvider !== undefined)
            provider.defaultProvider = defaultProvider;
        if (apiKey)
            provider.apiKeyEncrypted = (0, secret_crypto_1.encryptSecret)(apiKey);
        if (llmModel !== undefined)
            provider.llmModel = llmModel;
        if (baseUrl !== undefined)
            provider.baseUrl = baseUrl;
        await provider.save();
        // Clear settings cache
        (0, ai_config_service_1.clearSettingsCache)();
        // Re-init the provider manager so it picks up new settings immediately
        const manager = (0, ai_provider_manager_1.getProviderManager)();
        await manager.reloadProviders();
        return (0, api_response_1.ok)(res, { message: "Provider updated successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProvider = updateProvider;
const checkHealth = async (req, res, next) => {
    try {
        const manager = (0, ai_provider_manager_1.getProviderManager)();
        const results = await manager.checkAllHealth();
        return (0, api_response_1.ok)(res, { results });
    }
    catch (error) {
        next(error);
    }
};
exports.checkHealth = checkHealth;
const testProvider = async (req, res, next) => {
    try {
        const { id } = req.params;
        const provider = await ai_provider_settings_model_1.default.findById(id);
        if (!provider)
            return res.status(404).json({ success: false, message: "Provider not found" });
        const manager = (0, ai_provider_manager_1.getProviderManager)();
        const result = await manager.testSingleProvider(provider);
        return (0, api_response_1.ok)(res, { result });
    }
    catch (error) {
        next(error);
    }
};
exports.testProvider = testProvider;
const getAnalytics = async (req, res, next) => {
    try {
        // Simple aggregation of usage
        const stats = await ai_call_log_model_1.default.aggregate([
            {
                $group: {
                    _id: { provider: "$provider", status: "$status" },
                    count: { $sum: 1 },
                    avgLatency: { $avg: "$latencyMs" },
                    totalTokens: { $sum: "$tokensUsed" },
                    totalCost: { $sum: "$cost" }
                }
            }
        ]);
        return (0, api_response_1.ok)(res, { stats });
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalytics = getAnalytics;
