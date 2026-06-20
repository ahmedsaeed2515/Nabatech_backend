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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFeedback = exports.getAllChatLogs = exports.getChatSessions = exports.getChatHistory = exports.chatWithAI = void 0;
var message_model_1 = __importDefault(require("../models/message_model"));
var ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
var ai_errors_1 = require("../services/ai/ai_errors");
var chat_schemas_1 = require("../validation/chat_schemas");
var crypto_1 = __importDefault(require("crypto"));
var message_feedback_model_1 = __importDefault(require("../models/message_feedback_model"));
/**
 * Loads recent message history from DB for a given user+conversationId.
 * Returns up to `limit` messages in chronological order (oldest first).
 * This is the server-side memory — it is the ground truth for what was said.
 */
var loadDbHistory = function (userId_1, conversationId_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([userId_1, conversationId_1], args_1, true), void 0, function (userId, conversationId, limit) {
        var messages, error_1;
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, message_model_1.default.find({
                            user: userId,
                            conversationId: conversationId,
                            role: { $in: ["user", "assistant"] },
                            status: "sent",
                        })
                            .sort({ createdAt: -1, _id: -1 })
                            .limit(limit)
                            .lean()];
                case 1:
                    messages = _a.sent();
                    // Reverse to chronological order (oldest first) for LLM context window
                    return [2 /*return*/, messages.reverse().map(function (m) { return ({
                            role: m.role === "assistant" ? "assistant" : "user",
                            content: m.text,
                        }); })];
                case 2:
                    error_1 = _a.sent();
                    console.warn("Failed to load DB history, proceeding with client history:", (0, ai_errors_1.sanitizeErrorMessage)(error_1));
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
};
/**
 * Merges server-side DB history with client-sent history.
 * DB history is the ground truth; client history fills gaps for very recent
 * messages that may not yet be committed (optimistic UI sends).
 * Deduplicates by (role, content) to avoid double-injecting the same message.
 */
var mergeHistory = function (dbHistory, clientHistory) {
    if (!dbHistory.length)
        return clientHistory.slice(-20);
    // Build a set of known (role+content) pairs from DB history
    var dbSet = new Set(dbHistory.map(function (m) { return "".concat(m.role, "::").concat(m.content.trim()); }));
    // Append any client messages NOT already in DB (e.g., very recent unsaved turns)
    var extraFromClient = clientHistory.filter(function (m) { return !dbSet.has("".concat(m.role, "::").concat(m.content.trim())); });
    var merged = __spreadArray(__spreadArray([], dbHistory, true), extraFromClient, true);
    // Bound to last 20 messages (10 turns) for token safety
    return merged.slice(-20);
};
var chatWithAI = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var text, clientHistory, topK, clientOperationId, language, trimmedText, userId, requestId, conversationId, existing, dbHistory, history_1, chatResult, aiError_1, aiResponse, assistantMsg, error_2;
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _g.trys.push([0, 11, , 12]);
                text = (((_a = req.body) === null || _a === void 0 ? void 0 : _a.text) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.question) || "").toString();
                clientHistory = Array.isArray((_c = req.body) === null || _c === void 0 ? void 0 : _c.history) ? req.body.history : [];
                topK = Number((_d = req.body) === null || _d === void 0 ? void 0 : _d.top_k) || undefined;
                clientOperationId = (_e = req.body) === null || _e === void 0 ? void 0 : _e.clientOperationId;
                language = (req.headers["accept-language"] || req.headers["x-app-language"] || "en").toString().split(",")[0].trim().split("-")[0];
                if (!(0, chat_schemas_1.validateChatText)(text)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Message is required and must be under 2000 characters" })];
                }
                if (!(0, chat_schemas_1.validateChatHistory)(clientHistory)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid history format or length" })];
                }
                trimmedText = text.trim();
                userId = req.user.id;
                requestId = crypto_1.default.randomUUID();
                conversationId = ((_f = req.body) === null || _f === void 0 ? void 0 : _f.conversationId) || "conv-".concat(crypto_1.default.randomUUID());
                if (!clientOperationId) return [3 /*break*/, 2];
                return [4 /*yield*/, message_model_1.default.findOne({ user: userId, clientOperationId: clientOperationId, role: "assistant" })];
            case 1:
                existing = _g.sent();
                if (existing) {
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            message: existing.text,
                            messageId: existing._id,
                            source: existing.source,
                            provider: { name: existing.provider },
                            sourceIds: existing.sourceIds,
                        })];
                }
                _g.label = 2;
            case 2: return [4 /*yield*/, loadDbHistory(userId, conversationId, 20)];
            case 3:
                dbHistory = _g.sent();
                history_1 = mergeHistory(dbHistory, clientHistory);
                // Create a MongoDB Message log for user query
                return [4 /*yield*/, message_model_1.default.create({
                        user: userId,
                        sender: "user", // Legacy
                        role: "user",
                        text: trimmedText,
                        conversationId: conversationId,
                        requestId: requestId,
                        status: "sent"
                    })];
            case 4:
                // Create a MongoDB Message log for user query
                _g.sent();
                chatResult = void 0;
                _g.label = 5;
            case 5:
                _g.trys.push([5, 7, , 9]);
                return [4 /*yield*/, (0, ai_orchestrator_service_1.orchestrateChat)({
                        userId: userId,
                        requestId: requestId,
                        question: trimmedText,
                        history: history_1, // ✅ FIX #1: merged DB + client history injected
                        topK: topK,
                        language: language,
                    })];
            case 6:
                chatResult = _g.sent();
                return [3 /*break*/, 9];
            case 7:
                aiError_1 = _g.sent();
                // Record failed assistant response
                return [4 /*yield*/, message_model_1.default.create({
                        user: userId,
                        sender: "llm", // Legacy
                        role: "assistant",
                        text: "Sorry, I am unable to respond at this time.",
                        conversationId: conversationId,
                        requestId: requestId,
                        clientOperationId: clientOperationId,
                        status: "failed",
                        errorCode: "PROVIDER_UNAVAILABLE"
                    })];
            case 8:
                // Record failed assistant response
                _g.sent();
                console.error("Chat orchestration failure:", (0, ai_errors_1.sanitizeErrorMessage)(aiError_1));
                return [2 /*return*/, res.status(502).json({ success: false, message: "Chat failed" })];
            case 9:
                aiResponse = chatResult.message;
                return [4 /*yield*/, message_model_1.default.create({
                        user: userId,
                        sender: "llm", // Legacy
                        role: "assistant",
                        text: aiResponse,
                        conversationId: conversationId,
                        requestId: requestId,
                        clientOperationId: clientOperationId,
                        status: "sent",
                        provider: chatResult.provider,
                        source: chatResult.source,
                        sourceIds: [chatResult.provider]
                    })];
            case 10:
                assistantMsg = _g.sent();
                // Return response with success and message fields
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        message: aiResponse,
                        messageId: assistantMsg._id,
                        source: chatResult.source,
                        provider: { name: chatResult.provider },
                        sourceIds: assistantMsg.sourceIds
                    })];
            case 11:
                error_2 = _g.sent();
                console.error(error_2);
                res.status(500).json({ message: "Failed to process chat message", error: error_2 });
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.chatWithAI = chatWithAI;
var getChatHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, cursor, limit, conversationId, query, cursorMsg, messages, sorted, payload, nextCursor, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.id;
                cursor = req.query.cursor;
                limit = Math.min(Number(req.query.limit) || 50, 50);
                conversationId = req.query.conversationId;
                query = { user: userId };
                if (conversationId) {
                    query.conversationId = conversationId;
                }
                if (!cursor) return [3 /*break*/, 2];
                return [4 /*yield*/, message_model_1.default.findById(cursor)];
            case 1:
                cursorMsg = _a.sent();
                if (!cursorMsg) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "VALIDATION_FAILED: Invalid cursor" })];
                }
                query.$or = [
                    { createdAt: { $lt: cursorMsg.createdAt } },
                    { createdAt: cursorMsg.createdAt, _id: { $lt: cursor } }
                ];
                _a.label = 2;
            case 2: return [4 /*yield*/, message_model_1.default.find(query)
                    .sort({ createdAt: -1, _id: -1 })
                    .limit(limit)];
            case 3:
                messages = _a.sent();
                sorted = messages.reverse();
                payload = sorted.map(function (m) { return ({
                    id: m._id,
                    sender: m.sender,
                    role: m.role || (m.sender === "llm" ? "assistant" : "user"),
                    text: m.text,
                    status: m.status || "sent",
                    provider: m.provider,
                    source: m.source,
                    sourceIds: m.sourceIds,
                    // ✅ FIX #3: include image fields so image chat messages render correctly
                    imageUrl: m.imageUrl,
                    diagnosisResult: m.diagnosisResult,
                    createdAt: m.createdAt
                }); });
                nextCursor = messages.length === limit ? messages[0]._id : null;
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: payload,
                            pageInfo: { nextCursor: nextCursor, hasNextPage: !!nextCursor }
                        },
                        messages: payload // Legacy fallback
                    })];
            case 4:
                error_3 = _a.sent();
                console.error("Failed to fetch chat history:", error_3);
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch chat history", error: error_3 })];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getChatHistory = getChatHistory;
var getChatSessions = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, limit, sessions, payload, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                limit = Math.min(Number(req.query.limit) || 20, 20);
                return [4 /*yield*/, message_model_1.default.aggregate([
                        { $match: { user: require("mongoose").Types.ObjectId(userId) } },
                        { $sort: { createdAt: -1 } },
                        {
                            $group: {
                                _id: "$conversationId",
                                lastMessage: { $first: "$text" },
                                updatedAt: { $first: "$createdAt" },
                            }
                        },
                        { $sort: { updatedAt: -1 } },
                        { $limit: limit }
                    ])];
            case 1:
                sessions = _a.sent();
                payload = sessions.map(function (s) { return ({
                    conversationId: s._id,
                    title: s.lastMessage,
                    updatedAt: s.updatedAt,
                }); });
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: payload
                    })];
            case 2:
                error_4 = _a.sent();
                console.error("Failed to fetch chat sessions:", error_4);
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch chat sessions", error: error_4 })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getChatSessions = getChatSessions;
var getAllChatLogs = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, cursor, filterUserId, statusFilter, q, match, pipeline, mongoose, cursorDate, conversations, formattedConversations, nextCursor, flatMessagesList, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                limit = Math.min(Number(req.query.limit) || 50, 50);
                cursor = req.query.cursor;
                filterUserId = req.query.userId;
                statusFilter = req.query.status;
                q = req.query.q;
                match = {};
                if (filterUserId)
                    match.user = filterUserId;
                if (statusFilter)
                    match.status = statusFilter;
                if (q)
                    match.text = new RegExp("^".concat(q), "i"); // Prefix search
                pipeline = [];
                if (Object.keys(match).length > 0) {
                    if (match.user) {
                        mongoose = require("mongoose");
                        match.user = new mongoose.Types.ObjectId(match.user);
                    }
                    pipeline.push({ $match: match });
                }
                pipeline.push({ $sort: { createdAt: -1 } });
                pipeline.push({
                    $group: {
                        _id: { $ifNull: ["$conversationId", "$user"] },
                        userId: { $first: "$user" },
                        messageCount: { $sum: 1 },
                        lastMessageAt: { $max: "$createdAt" },
                        lastMessage: { $first: "$text" },
                        // ✅ FIX #3: include imageUrl in the group so image chats surface in logs
                        hasImageMessages: { $max: { $cond: [{ $ifNull: ["$imageUrl", false] }, 1, 0] } },
                        messages: {
                            $push: {
                                role: { $ifNull: ["$role", { $cond: [{ $eq: ["$sender", "llm"] }, "assistant", "user"] }] },
                                content: "$text",
                                timestamp: "$createdAt",
                                imageUrl: "$imageUrl",
                            }
                        }
                    }
                });
                if (cursor) {
                    cursorDate = new Date(Number(cursor));
                    if (!isNaN(cursorDate.getTime())) {
                        pipeline.push({ $match: { lastMessageAt: { $lt: cursorDate } } });
                    }
                }
                pipeline.push({ $sort: { lastMessageAt: -1 } });
                pipeline.push({ $limit: limit });
                return [4 /*yield*/, message_model_1.default.aggregate(pipeline)];
            case 1:
                conversations = _a.sent();
                formattedConversations = conversations.map(function (c) { return ({
                    userId: c.userId,
                    conversationId: c._id,
                    messageCount: c.messageCount,
                    lastMessage: c.lastMessage,
                    lastMessageAt: c.lastMessageAt,
                    hasImageMessages: Boolean(c.hasImageMessages),
                    messages: c.messages.slice(0, 5).reverse()
                }); });
                nextCursor = formattedConversations.length === limit
                    ? new Date(formattedConversations[formattedConversations.length - 1].lastMessageAt).getTime()
                    : null;
                flatMessagesList = conversations.flatMap(function (c) { return c.messages; }).slice(0, 50);
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            conversations: formattedConversations,
                            pageInfo: { nextCursor: nextCursor, hasNextPage: !!nextCursor }
                        },
                        conversations: formattedConversations, // Legacy envelope
                        messages: flatMessagesList // Legacy fallback
                    })];
            case 2:
                error_5 = _a.sent();
                console.error("Failed to fetch chat logs:", error_5);
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch chat logs", error: error_5 })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllChatLogs = getAllChatLogs;
var submitFeedback = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, messageId, rating, textFeedback, isHallucination, category, message, feedback, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                _a = req.body, messageId = _a.messageId, rating = _a.rating, textFeedback = _a.textFeedback, isHallucination = _a.isHallucination, category = _a.category;
                if (!messageId || !rating) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "messageId and rating are required" })];
                }
                return [4 /*yield*/, message_model_1.default.findById(messageId)];
            case 1:
                message = _b.sent();
                if (!message) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Message not found" })];
                }
                return [4 /*yield*/, message_feedback_model_1.default.findOneAndUpdate({ message: messageId, user: userId }, { rating: rating, textFeedback: textFeedback, isHallucination: Boolean(isHallucination), category: category }, { upsert: true, new: true })];
            case 2:
                feedback = _b.sent();
                return [2 /*return*/, res.status(200).json({ success: true, feedback: feedback })];
            case 3:
                error_6 = _b.sent();
                console.error("Failed to submit feedback:", error_6);
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to submit feedback", error: error_6 })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.submitFeedback = submitFeedback;
