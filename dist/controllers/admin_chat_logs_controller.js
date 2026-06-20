"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatDiagnoses = exports.getChatToolCalls = exports.getChatAnalytics = exports.getChatSessions = exports.getChatLogById = exports.getChatLogs = void 0;
const conversation_model_1 = __importDefault(require("../models/conversation_model"));
const message_model_1 = __importDefault(require("../models/message_model"));
const chat_session_model_1 = __importDefault(require("../models/chat_session_model"));
const ai_tool_call_model_1 = __importDefault(require("../models/ai_tool_call_model"));
const ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const api_response_1 = require("../utils/api_response");
// @desc    Admin: Get all chat logs (conversations)
// @route   GET /api/admin/chat-logs
const getChatLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const status = req.query.status;
        const query = {};
        if (search) {
            query.title = { $regex: search, $options: "i" };
        }
        if (status) {
            query.status = status;
        }
        const conversations = await conversation_model_1.default.find(query)
            .populate("user", "name email avatarUrl")
            .sort({ lastMessageAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await conversation_model_1.default.countDocuments(query);
        return (0, api_response_1.ok)(res, {
            conversations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatLogs = getChatLogs;
// @desc    Admin: Get single conversation with messages & tool calls
// @route   GET /api/admin/chat-logs/:id
const getChatLogById = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        // We can also fetch using the string conversationId from Message model if legacy
        let conversation = await conversation_model_1.default.findById(conversationId).populate("user", "name email");
        // Fetch messages
        const messagesQuery = conversation ? { conversationId: conversation._id.toString() } : { conversationId };
        const messages = await message_model_1.default.find(messagesQuery).sort({ createdAt: 1 });
        // Fetch tool calls
        const toolCalls = await ai_tool_call_model_1.default.find({ conversationId: conversation ? conversation._id : null }).sort({ createdAt: 1 });
        return (0, api_response_1.ok)(res, {
            conversation,
            messages,
            toolCalls,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatLogById = getChatLogById;
// @desc    Admin: Get chat sessions
// @route   GET /api/admin/chat-sessions
const getChatSessions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sessions = await chat_session_model_1.default.find()
            .populate("user", "name email")
            .sort({ startedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await chat_session_model_1.default.countDocuments();
        return (0, api_response_1.ok)(res, {
            sessions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatSessions = getChatSessions;
// @desc    Admin: Get chat analytics (observability)
// @route   GET /api/admin/chat-analytics
const getChatAnalytics = async (req, res, next) => {
    try {
        const totalConversations = await conversation_model_1.default.countDocuments();
        const totalMessages = await message_model_1.default.countDocuments();
        const tokenAgg = await chat_session_model_1.default.aggregate([
            { $group: { _id: null, totalTokens: { $sum: "$totalTokensUsed" } } }
        ]);
        const totalTokensUsed = tokenAgg[0]?.totalTokens || 0;
        const latencyAgg = await ai_call_log_model_1.default.aggregate([
            { $group: { _id: null, avgLatency: { $avg: "$latencyMs" } } }
        ]);
        const avgLatencyMs = latencyAgg[0]?.avgLatency || 0;
        const failuresAgg = await ai_call_log_model_1.default.aggregate([
            { $match: { status: "failure" } },
            { $count: "failures" }
        ]);
        const totalFailures = failuresAgg[0]?.failures || 0;
        const modelAgg = await ai_call_log_model_1.default.aggregate([
            { $group: { _id: "$provider", count: { $sum: 1 } } }
        ]);
        return (0, api_response_1.ok)(res, {
            totalConversations,
            totalMessages,
            totalTokensUsed,
            avgLatencyMs,
            totalFailures,
            modelUsage: modelAgg,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatAnalytics = getChatAnalytics;
// @desc    Admin: Get chat tool calls
// @route   GET /api/admin/chat-tool-calls
const getChatToolCalls = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const toolCalls = await ai_tool_call_model_1.default.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await ai_tool_call_model_1.default.countDocuments();
        // Usage counts
        const countsAgg = await ai_tool_call_model_1.default.aggregate([
            { $group: { _id: "$toolName", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        return (0, api_response_1.ok)(res, {
            toolCalls,
            toolCounts: countsAgg,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatToolCalls = getChatToolCalls;
// @desc    Admin: Get chat diagnoses history
// @route   GET /api/admin/chat-diagnoses
const getChatDiagnoses = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const diagnoses = await diagnosis_history_model_1.default.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await diagnosis_history_model_1.default.countDocuments();
        return (0, api_response_1.ok)(res, {
            diagnoses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatDiagnoses = getChatDiagnoses;
