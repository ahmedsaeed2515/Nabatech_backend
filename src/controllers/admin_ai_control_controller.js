"use strict";
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
exports.getToolMetrics = exports.getAiLogs = exports.getCosts = exports.getBenchmarks = exports.updateRoutingRule = exports.getRoutingRules = exports.deleteModel = exports.updateModel = exports.createModel = exports.getModels = exports.createProvider = exports.getProviders = void 0;
var ai_provider_model_1 = __importDefault(require("../models/ai_provider_model"));
var ai_model_model_1 = __importDefault(require("../models/ai_model_model"));
var ai_routing_rule_model_1 = __importDefault(require("../models/ai_routing_rule_model"));
var ai_benchmark_model_1 = __importDefault(require("../models/ai_benchmark_model"));
var ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
var secret_crypto_1 = require("../services/ai/secret_crypto");
var api_response_1 = require("../utils/api_response");
// --- Providers ---
var getProviders = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var providers, safeProviders, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_provider_model_1.default.find()];
            case 1:
                providers = _a.sent();
                safeProviders = providers.map(function (p) {
                    var obj = p.toObject();
                    delete obj.apiKeyEnc;
                    return obj;
                });
                return [2 /*return*/, (0, api_response_1.ok)(res, { providers: safeProviders })];
            case 2:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getProviders = getProviders;
var createProvider = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, displayName, baseUrl, apiKey, provider, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, name_1 = _a.name, displayName = _a.displayName, baseUrl = _a.baseUrl, apiKey = _a.apiKey;
                return [4 /*yield*/, ai_provider_model_1.default.create({
                        name: name_1,
                        displayName: displayName,
                        baseUrl: baseUrl,
                        apiKeyEnc: (0, secret_crypto_1.encryptSecret)(apiKey),
                    })];
            case 1:
                provider = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { provider: { id: provider._id, name: provider.name } })];
            case 2:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createProvider = createProvider;
// --- Models ---
var getModels = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var models, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_model_model_1.default.find().populate("provider", "name displayName baseUrl")];
            case 1:
                models = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { models: models })];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getModels = getModels;
var createModel = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var model, populated, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, ai_model_model_1.default.create(req.body)];
            case 1:
                model = _a.sent();
                return [4 /*yield*/, model.populate("provider", "name displayName")];
            case 2:
                populated = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { model: populated })];
            case 3:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createModel = createModel;
var updateModel = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var model, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_model_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("provider", "name displayName")];
            case 1:
                model = _a.sent();
                if (!model)
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Model not found" })];
                return [2 /*return*/, (0, api_response_1.ok)(res, { model: model })];
            case 2:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateModel = updateModel;
var deleteModel = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var model, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_model_model_1.default.findByIdAndDelete(req.params.id)];
            case 1:
                model = _a.sent();
                if (!model)
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Model not found" })];
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Model deleted" })];
            case 2:
                error_6 = _a.sent();
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteModel = deleteModel;
// --- Routing Rules ---
var getRoutingRules = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var rules, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_routing_rule_model_1.default.find()
                        .populate({
                        path: "primaryModel",
                        populate: { path: "provider", select: "name displayName" }
                    })
                        .populate({
                        path: "fallbackModels",
                        populate: { path: "provider", select: "name displayName" }
                    })
                        .populate("abTestModel")];
            case 1:
                rules = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { rules: rules })];
            case 2:
                error_7 = _a.sent();
                next(error_7);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getRoutingRules = getRoutingRules;
var updateRoutingRule = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, primaryModel, fallbackModels, abTestActive, abTestModel, abTestSplit, active, rule, populated, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                _a = req.body, primaryModel = _a.primaryModel, fallbackModels = _a.fallbackModels, abTestActive = _a.abTestActive, abTestModel = _a.abTestModel, abTestSplit = _a.abTestSplit, active = _a.active;
                return [4 /*yield*/, ai_routing_rule_model_1.default.findById(req.params.id)];
            case 1:
                rule = _b.sent();
                if (!!rule) return [3 /*break*/, 5];
                if (!req.body.useCase) return [3 /*break*/, 3];
                return [4 /*yield*/, ai_routing_rule_model_1.default.create(req.body)];
            case 2:
                rule = _b.sent();
                return [3 /*break*/, 4];
            case 3: return [2 /*return*/, res.status(404).json({ success: false, message: "Rule not found" })];
            case 4: return [3 /*break*/, 7];
            case 5:
                Object.assign(rule, req.body);
                return [4 /*yield*/, rule.save()];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7: return [4 /*yield*/, rule.populate("primaryModel fallbackModels")];
            case 8:
                populated = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { rule: populated })];
            case 9:
                error_8 = _b.sent();
                next(error_8);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.updateRoutingRule = updateRoutingRule;
// --- Benchmarks ---
var getBenchmarks = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var benchmarks, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_benchmark_model_1.default.find().populate("model", "displayName modelId type").sort({ testedAt: -1 }).limit(100)];
            case 1:
                benchmarks = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { benchmarks: benchmarks })];
            case 2:
                error_9 = _a.sent();
                next(error_9);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getBenchmarks = getBenchmarks;
// --- Costs ---
var getCosts = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var costAgg, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_call_log_model_1.default.aggregate([
                        { $group: { _id: "$modelId", totalCalls: { $sum: 1 }, totalCost: { $sum: { $ifNull: ["$cost", 0] } } } }
                    ])];
            case 1:
                costAgg = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { costs: costAgg })];
            case 2:
                error_10 = _a.sent();
                next(error_10);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getCosts = getCosts;
// --- Logs & Metrics ---
var getAiLogs = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, _a, userId, feature, status_1, startDate, endDate, query, total, logs, error_11;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 50;
                _a = req.query, userId = _a.userId, feature = _a.feature, status_1 = _a.status, startDate = _a.startDate, endDate = _a.endDate;
                query = {};
                if (userId)
                    query.userId = userId;
                if (feature)
                    query.feature = feature;
                if (status_1)
                    query.status = status_1;
                if (startDate || endDate) {
                    query.createdAt = {};
                    if (startDate)
                        query.createdAt.$gte = new Date(startDate);
                    if (endDate)
                        query.createdAt.$lte = new Date(endDate);
                }
                return [4 /*yield*/, ai_call_log_model_1.default.countDocuments(query)];
            case 1:
                total = _b.sent();
                return [4 /*yield*/, ai_call_log_model_1.default.find(query)
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)];
            case 2:
                logs = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        logs: logs,
                        pagination: {
                            total: total,
                            page: page,
                            limit: limit,
                            pages: Math.ceil(total / limit)
                        }
                    })];
            case 3:
                error_11 = _b.sent();
                next(error_11);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAiLogs = getAiLogs;
var getToolMetrics = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var days, cutoff, metrics, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                days = parseInt(req.query.days) || 7;
                cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                return [4 /*yield*/, ai_call_log_model_1.default.aggregate([
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
                    ])];
            case 1:
                metrics = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { metrics: metrics })];
            case 2:
                error_12 = _a.sent();
                next(error_12);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getToolMetrics = getToolMetrics;
