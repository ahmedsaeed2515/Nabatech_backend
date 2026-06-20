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
exports.replyToOwnTicket = exports.getUserTicketById = exports.getUserTickets = exports.createTicket = void 0;
var ticket_model_1 = __importStar(require("../models/ticket_model"));
var ticket_reply_model_1 = __importDefault(require("../models/ticket_reply_model"));
var ticket_history_model_1 = __importDefault(require("../models/ticket_history_model"));
var AiSupportService_1 = require("../services/AiSupportService");
var api_response_1 = require("../utils/api_response");
var app_error_1 = require("../utils/app_error");
// @desc    User: Create support ticket
// @route   POST /api/tickets
// @access  Public (Optional Auth)
var createTicket = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, email, subject, message, attachments, user, aiSupportService, aiResult, ticket, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, name_1 = _a.name, email = _a.email, subject = _a.subject, message = _a.message, attachments = _a.attachments;
                user = req.user;
                if (!name_1 || !email || !subject || !message) {
                    throw new app_error_1.AppError({
                        code: 'VALIDATION_ERROR',
                        statusCode: 400,
                        message: 'Name, email, subject, and message are required'
                    });
                }
                aiSupportService = new AiSupportService_1.AiSupportService();
                return [4 /*yield*/, aiSupportService.analyzeTicket(subject, message, email)];
            case 1:
                aiResult = _b.sent();
                return [4 /*yield*/, ticket_model_1.default.create({
                        user: user ? user._id : undefined,
                        name: name_1,
                        email: email,
                        subject: subject,
                        message: message,
                        attachments: attachments || [],
                        status: ticket_model_1.TicketStatus.NEW,
                        priority: aiResult.priority,
                        category: aiResult.category,
                        sentiment: aiResult.sentiment,
                        suggestedReply: aiResult.suggestedReply,
                        isDuplicate: aiResult.isDuplicate,
                        duplicateOf: aiResult.duplicateOf
                    })];
            case 2:
                ticket = _b.sent();
                if (!user) return [3 /*break*/, 4];
                return [4 /*yield*/, ticket_history_model_1.default.create({
                        ticket: ticket._id,
                        user: user._id,
                        action: "ticket_created",
                        details: "Ticket created by logged-in user"
                    })];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: return [2 /*return*/, (0, api_response_1.ok)(res, {
                    message: "Ticket submitted successfully",
                    ticket: {
                        id: ticket._id,
                        name: ticket.name,
                        email: ticket.email,
                        subject: ticket.subject,
                        message: ticket.message,
                        status: ticket.status,
                        priority: ticket.priority,
                        category: ticket.category,
                        sentiment: ticket.sentiment,
                        isDuplicate: ticket.isDuplicate,
                        createdAt: ticket.createdAt
                    }
                })];
            case 5:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.createTicket = createTicket;
// @desc    User: Get own tickets list
// @route   GET /api/tickets
// @access  Private
var getUserTickets = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, page, limit, skip, query, total, tickets, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    throw new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
                }
                page = parseInt(req.query.page, 10) || 1;
                limit = parseInt(req.query.limit, 10) || 20;
                skip = (page - 1) * limit;
                query = {
                    $or: [
                        { user: user._id },
                        { email: user.email }
                    ],
                    deletedAt: null
                };
                return [4 /*yield*/, ticket_model_1.default.countDocuments(query)];
            case 1:
                total = _a.sent();
                return [4 /*yield*/, ticket_model_1.default.find(query)
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)];
            case 2:
                tickets = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        total: total,
                        page: page,
                        totalPages: Math.ceil(total / limit),
                        tickets: tickets.map(function (t) { return ({
                            id: t._id,
                            name: t.name,
                            email: t.email,
                            subject: t.subject,
                            message: t.message,
                            status: t.status,
                            priority: t.priority,
                            category: t.category,
                            createdAt: t.createdAt
                        }); })
                    })];
            case 3:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUserTickets = getUserTickets;
// @desc    User: Get own ticket details & replies
// @route   GET /api/tickets/:id
// @access  Private
var getUserTicketById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, ticket, replies, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    throw new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
                }
                return [4 /*yield*/, ticket_model_1.default.findOne({
                        _id: req.params.id,
                        $or: [
                            { user: user._id },
                            { email: user.email }
                        ],
                        deletedAt: null
                    })];
            case 1:
                ticket = _a.sent();
                if (!ticket) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found or access denied' });
                }
                return [4 /*yield*/, ticket_reply_model_1.default.find({
                        ticket: ticket._id,
                        isInternalNote: false
                    })
                        .sort({ createdAt: 1 })
                        .populate('sender', 'firstName lastName role avatarUrl')];
            case 2:
                replies = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        ticket: {
                            id: ticket._id,
                            name: ticket.name,
                            email: ticket.email,
                            subject: ticket.subject,
                            message: ticket.message,
                            status: ticket.status,
                            priority: ticket.priority,
                            category: ticket.category,
                            attachments: ticket.attachments || [],
                            createdAt: ticket.createdAt
                        },
                        replies: replies.map(function (r) { return ({
                            id: r._id,
                            message: r.message,
                            attachments: r.attachments || [],
                            createdAt: r.createdAt,
                            sender: r.sender ? {
                                id: r.sender._id,
                                name: "".concat(r.sender.firstName || '', " ").concat(r.sender.lastName || '').trim(),
                                role: r.sender.role,
                                avatarUrl: r.sender.avatarUrl
                            } : null
                        }); })
                    })];
            case 3:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUserTicketById = getUserTicketById;
// @desc    User: Reply to own ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
var replyToOwnTicket = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, reply_message, attachments, user, ticket, reply, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, reply_message = _a.reply_message, attachments = _a.attachments;
                user = req.user;
                if (!user) {
                    throw new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
                }
                if (!reply_message || !reply_message.trim()) {
                    throw new app_error_1.AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Reply message cannot be empty' });
                }
                return [4 /*yield*/, ticket_model_1.default.findOne({
                        _id: req.params.id,
                        $or: [
                            { user: user._id },
                            { email: user.email }
                        ],
                        deletedAt: null
                    })];
            case 1:
                ticket = _b.sent();
                if (!ticket) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found or access denied' });
                }
                return [4 /*yield*/, ticket_reply_model_1.default.create({
                        ticket: ticket._id,
                        sender: user._id,
                        message: reply_message.trim(),
                        isInternalNote: false,
                        attachments: attachments || []
                    })];
            case 2:
                reply = _b.sent();
                // Update ticket status to open since user replied and we need to alert agent
                ticket.status = ticket_model_1.TicketStatus.OPEN;
                return [4 /*yield*/, ticket.save()];
            case 3:
                _b.sent();
                // Log history
                return [4 /*yield*/, ticket_history_model_1.default.create({
                        ticket: ticket._id,
                        user: user._id,
                        action: "user_reply_added",
                        details: "Customer added a reply to the ticket"
                    })];
            case 4:
                // Log history
                _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        message: "Reply submitted successfully",
                        reply: {
                            id: reply._id,
                            message: reply.message,
                            attachments: reply.attachments,
                            createdAt: reply.createdAt,
                            sender: {
                                id: user._id,
                                name: "".concat(user.firstName || '', " ").concat(user.lastName || '').trim(),
                                role: user.role
                            }
                        }
                    })];
            case 5:
                error_4 = _b.sent();
                next(error_4);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.replyToOwnTicket = replyToOwnTicket;
