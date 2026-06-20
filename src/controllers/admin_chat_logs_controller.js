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
exports.getChatDiagnoses = exports.getChatToolCalls = exports.getChatAnalytics = exports.getChatSessions = exports.getChatLogById = exports.getChatLogs = void 0;
var conversation_model_1 = __importDefault(require("../models/conversation_model"));
var message_model_1 = __importDefault(require("../models/message_model"));
var chat_session_model_1 = __importDefault(require("../models/chat_session_model"));
var ai_tool_call_model_1 = __importDefault(require("../models/ai_tool_call_model"));
var ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var api_response_1 = require("../utils/api_response");
// @desc    Admin: Get all chat logs (conversations)
// @route   GET /api/admin/chat-logs
var getChatLogs = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, search, status_1, query, conversations, total, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                search = req.query.search;
                status_1 = req.query.status;
                query = {};
                if (search) {
                    query.title = { $regex: search, $options: "i" };
                }
                if (status_1) {
                    query.status = status_1;
                }
                return [4 /*yield*/, conversation_model_1.default.find(query)
                        .populate("user", "name email avatarUrl")
                        .sort({ lastMessageAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)];
            case 1:
                conversations = _a.sent();
                return [4 /*yield*/, conversation_model_1.default.countDocuments(query)];
            case 2:
                total = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        conversations: conversations,
                        pagination: {
                            page: page,
                            limit: limit,
                            total: total,
                            pages: Math.ceil(total / limit),
                        },
                    })];
            case 3:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getChatLogs = getChatLogs;
// @desc    Admin: Get single conversation with messages & tool calls
// @route   GET /api/admin/chat-logs/:id
var getChatLogById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var conversationId, conversation, messagesQuery, messages, toolCalls, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                conversationId = req.params.id;
                return [4 /*yield*/, conversation_model_1.default.findById(conversationId).populate("user", "name email")];
            case 1:
                conversation = _a.sent();
                messagesQuery = conversation ? { conversationId: conversation._id.toString() } : { conversationId: conversationId };
                return [4 /*yield*/, message_model_1.default.find(messagesQuery).sort({ createdAt: 1 })];
            case 2:
                messages = _a.sent();
                return [4 /*yield*/, ai_tool_call_model_1.default.find({ conversationId: conversation ? conversation._id : null }).sort({ createdAt: 1 })];
            case 3:
                toolCalls = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        conversation: conversation,
                        messages: messages,
                        toolCalls: toolCalls,
                    })];
            case 4:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getChatLogById = getChatLogById;
// @desc    Admin: Get chat sessions
// @route   GET /api/admin/chat-sessions
var getChatSessions = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, sessions, total, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                return [4 /*yield*/, chat_session_model_1.default.find()
                        .populate("user", "name email")
                        .sort({ startedAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)];
            case 1:
                sessions = _a.sent();
                return [4 /*yield*/, chat_session_model_1.default.countDocuments()];
            case 2:
                total = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        sessions: sessions,
                        pagination: {
                            page: page,
                            limit: limit,
                            total: total,
                            pages: Math.ceil(total / limit),
                        },
                    })];
            case 3:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getChatSessions = getChatSessions;
// @desc    Admin: Get chat analytics (observability)
// @route   GET /api/admin/chat-analytics
var getChatAnalytics = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var totalConversations, totalMessages, tokenAgg, totalTokensUsed, latencyAgg, avgLatencyMs, failuresAgg, totalFailures, modelAgg, error_4;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 7, , 8]);
                return [4 /*yield*/, conversation_model_1.default.countDocuments()];
            case 1:
                totalConversations = _d.sent();
                return [4 /*yield*/, message_model_1.default.countDocuments()];
            case 2:
                totalMessages = _d.sent();
                return [4 /*yield*/, chat_session_model_1.default.aggregate([
                        { $group: { _id: null, totalTokens: { $sum: "$totalTokensUsed" } } }
                    ])];
            case 3:
                tokenAgg = _d.sent();
                totalTokensUsed = ((_a = tokenAgg[0]) === null || _a === void 0 ? void 0 : _a.totalTokens) || 0;
                return [4 /*yield*/, ai_call_log_model_1.default.aggregate([
                        { $group: { _id: null, avgLatency: { $avg: "$latencyMs" } } }
                    ])];
            case 4:
                latencyAgg = _d.sent();
                avgLatencyMs = ((_b = latencyAgg[0]) === null || _b === void 0 ? void 0 : _b.avgLatency) || 0;
                return [4 /*yield*/, ai_call_log_model_1.default.aggregate([
                        { $match: { status: "failure" } },
                        { $count: "failures" }
                    ])];
            case 5:
                failuresAgg = _d.sent();
                totalFailures = ((_c = failuresAgg[0]) === null || _c === void 0 ? void 0 : _c.failures) || 0;
                return [4 /*yield*/, ai_call_log_model_1.default.aggregate([
                        { $group: { _id: "$provider", count: { $sum: 1 } } }
                    ])];
            case 6:
                modelAgg = _d.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        totalConversations: totalConversations,
                        totalMessages: totalMessages,
                        totalTokensUsed: totalTokensUsed,
                        avgLatencyMs: avgLatencyMs,
                        totalFailures: totalFailures,
                        modelUsage: modelAgg,
                    })];
            case 7:
                error_4 = _d.sent();
                next(error_4);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getChatAnalytics = getChatAnalytics;
// @desc    Admin: Get chat tool calls
// @route   GET /api/admin/chat-tool-calls
var getChatToolCalls = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, toolCalls, total, countsAgg, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                return [4 /*yield*/, ai_tool_call_model_1.default.find()
                        .populate("user", "name email")
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)];
            case 1:
                toolCalls = _a.sent();
                return [4 /*yield*/, ai_tool_call_model_1.default.countDocuments()];
            case 2:
                total = _a.sent();
                return [4 /*yield*/, ai_tool_call_model_1.default.aggregate([
                        { $group: { _id: "$toolName", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ])];
            case 3:
                countsAgg = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        toolCalls: toolCalls,
                        toolCounts: countsAgg,
                        pagination: {
                            page: page,
                            limit: limit,
                            total: total,
                            pages: Math.ceil(total / limit),
                        },
                    })];
            case 4:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getChatToolCalls = getChatToolCalls;
// @desc    Admin: Get chat diagnoses history
// @route   GET /api/admin/chat-diagnoses
var getChatDiagnoses = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, diagnoses, total, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                return [4 /*yield*/, diagnosis_history_model_1.default.find()
                        .populate("user", "name email")
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)];
            case 1:
                diagnoses = _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments()];
            case 2:
                total = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        diagnoses: diagnoses,
                        pagination: {
                            page: page,
                            limit: limit,
                            total: total,
                            pages: Math.ceil(total / limit),
                        },
                    })];
            case 3:
                error_6 = _a.sent();
                next(error_6);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getChatDiagnoses = getChatDiagnoses;
