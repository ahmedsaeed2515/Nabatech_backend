"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToolMetrics = exports.getAiLogs = exports.getCosts = exports.getBenchmarks = exports.updateRoutingRule = exports.getRoutingRules = exports.deleteModel = exports.updateModel = exports.createModel = exports.getModels = exports.createProvider = exports.getProviders = void 0;
const ai_provider_model_1 = __importDefault(require("../models/ai_provider_model"));
const ai_model_model_1 = __importDefault(require("../models/ai_model_model"));
const ai_routing_rule_model_1 = __importDefault(require("../models/ai_routing_rule_model"));
const ai_benchmark_model_1 = __importDefault(require("../models/ai_benchmark_model"));
const ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
const secret_crypto_1 = require("../services/ai/secret_crypto");
const api_response_1 = require("../utils/api_response");
const ai_config_service_1 = require("../services/ai/ai_config_service");
// --- Providers ---
const getProviders = async (req, res, next) => {
    try {
        const providers = await ai_provider_model_1.default.find();
        // Exclude API keys from output
        const safeProviders = providers.map((p) => {
            const obj = p.toObject();
            delete obj.apiKeyEnc;
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
        const { name, displayName, baseUrl, apiKey } = req.body;
        const provider = await ai_provider_model_1.default.create({
            name,
            displayName,
            baseUrl,
            apiKeyEnc: (0, secret_crypto_1.encryptSecret)(apiKey),
        });
        (0, ai_config_service_1.clearSettingsCache)();
        return (0, api_response_1.ok)(res, { provider: { id: provider._id, name: provider.name } });
    }
    catch (error) {
        next(error);
    }
};
exports.createProvider = createProvider;
// --- Models ---
const getModels = async (req, res, next) => {
    try {
        const models = await ai_model_model_1.default.find().populate("provider", "name displayName baseUrl");
        return (0, api_response_1.ok)(res, { models });
    }
    catch (error) {
        next(error);
    }
};
exports.getModels = getModels;
const createModel = async (req, res, next) => {
    try {
        const model = await ai_model_model_1.default.create(req.body);
        (0, ai_config_service_1.clearSettingsCache)();
        const populated = await model.populate("provider", "name displayName");
        return (0, api_response_1.ok)(res, { model: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createModel = createModel;
const updateModel = async (req, res, next) => {
    try {
        const model = await ai_model_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("provider", "name displayName");
        if (!model)
            return res.status(404).json({ success: false, message: "Model not found" });
        (0, ai_config_service_1.clearSettingsCache)();
        return (0, api_response_1.ok)(res, { model });
    }
    catch (error) {
        next(error);
    }
};
exports.updateModel = updateModel;
const deleteModel = async (req, res, next) => {
    try {
        const model = await ai_model_model_1.default.findByIdAndDelete(req.params.id);
        if (!model)
            return res.status(404).json({ success: false, message: "Model not found" });
        (0, ai_config_service_1.clearSettingsCache)();
        return (0, api_response_1.ok)(res, { message: "Model deleted" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteModel = deleteModel;
// --- Routing Rules ---
const getRoutingRules = async (req, res, next) => {
    try {
        const rules = await ai_routing_rule_model_1.default.find()
            .populate({
            path: "primaryModel",
            populate: { path: "provider", select: "name displayName" }
        })
            .populate({
            path: "fallbackModels",
            populate: { path: "provider", select: "name displayName" }
        })
            .populate("abTestModel");
        return (0, api_response_1.ok)(res, { rules });
    }
    catch (error) {
        next(error);
    }
};
exports.getRoutingRules = getRoutingRules;
const updateRoutingRule = async (req, res, next) => {
    try {
        const { primaryModel, fallbackModels, abTestActive, abTestModel, abTestSplit, active } = req.body;
        let rule = await ai_routing_rule_model_1.default.findById(req.params.id);
        if (!rule) {
            // Create if it doesn't exist
            if (req.body.useCase) {
                rule = await ai_routing_rule_model_1.default.create(req.body);
            }
            else {
                return res.status(404).json({ success: false, message: "Rule not found" });
            }
        }
        else {
            Object.assign(rule, req.body);
            await rule.save();
        }
        (0, ai_config_service_1.clearSettingsCache)();
        const populated = await rule.populate("primaryModel fallbackModels");
        return (0, api_response_1.ok)(res, { rule: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateRoutingRule = updateRoutingRule;
// --- Benchmarks ---
const getBenchmarks = async (req, res, next) => {
    try {
        const benchmarks = await ai_benchmark_model_1.default.find().populate("model", "displayName modelId type").sort({ testedAt: -1 }).limit(100);
        return (0, api_response_1.ok)(res, { benchmarks });
    }
    catch (error) {
        next(error);
    }
};
exports.getBenchmarks = getBenchmarks;
// --- Costs ---
const getCosts = async (req, res, next) => {
    try {
        // Requires total input/output token usage per model. 
        // Since `AiCallLog` only has inputMeta/outputMeta or simple latencyMs,
        // we would aggregate it here. For the MVP, we mock aggregation to test UI.
        // Attempt aggregate over AiCallLog (assuming we add cost to it soon)
        const costAgg = await ai_call_log_model_1.default.aggregate([
            { $group: { _id: "$modelId", totalCalls: { $sum: 1 }, totalCost: { $sum: { $ifNull: ["$cost", 0] } } } }
        ]);
        return (0, api_response_1.ok)(res, { costs: costAgg });
    }
    catch (error) {
        next(error);
    }
};
exports.getCosts = getCosts;
// --- Logs & Metrics ---
const getAiLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const { userId, feature, status, startDate, endDate } = req.query;
        const query = {};
        if (userId)
            query.userId = userId;
        if (feature)
            query.feature = feature;
        if (status)
            query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        const total = await ai_call_log_model_1.default.countDocuments(query);
        const logs = await ai_call_log_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return (0, api_response_1.ok)(res, {
            logs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAiLogs = getAiLogs;
const getToolMetrics = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const metrics = await ai_call_log_model_1.default.aggregate([
            { $match: { createdAt: { $gte: cutoff }, toolCalls: { $exists: true, $not: { $size: 0 } } } },
            { $unwind: "$toolCalls" },
            {
                $group: {
                    _id: { toolName: "$toolCalls.toolName", status: "$toolCalls.status" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.toolName",
                    success: {
                        $sum: { $cond: [{ $eq: ["$_id.status", "success"] }, "$count", 0] }
                    },
                    failure: {
                        $sum: { $cond: [{ $eq: ["$_id.status", "failure"] }, "$count", 0] }
                    },
                    total: { $sum: "$count" }
                }
            },
            { $sort: { total: -1 } }
        ]);
        return (0, api_response_1.ok)(res, { metrics });
    }
    catch (error) {
        next(error);
    }
};
exports.getToolMetrics = getToolMetrics;
