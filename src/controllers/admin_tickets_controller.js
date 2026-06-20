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
exports.getAdminTicketsStats = exports.replyToTicket = exports.assignTicket = exports.updateTicketStatus = exports.getAdminTicketById = exports.getAdminTickets = void 0;
var ticket_model_1 = __importStar(require("../models/ticket_model"));
var ticket_reply_model_1 = __importDefault(require("../models/ticket_reply_model"));
var ticket_history_model_1 = __importDefault(require("../models/ticket_history_model"));
var user_model_1 = __importDefault(require("../models/user_model"));
var api_response_1 = require("../utils/api_response");
var app_error_1 = require("../utils/app_error");
// @desc    Admin: Get all tickets globally
// @route   GET /api/admin/tickets
// @access  Private/Admin
var getAdminTickets = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, _a, search, status_1, priority, category, assignedTo, sort, query, sortOption, total, tickets, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page, 10) || 1;
                limit = parseInt(req.query.limit, 10) || 20;
                skip = (page - 1) * limit;
                _a = req.query, search = _a.search, status_1 = _a.status, priority = _a.priority, category = _a.category, assignedTo = _a.assignedTo, sort = _a.sort;
                query = {};
                if (search) {
                    query.$or = [
                        { name: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                        { subject: { $regex: search, $options: "i" } },
                        { message: { $regex: search, $options: "i" } }
                    ];
                }
                if (status_1)
                    query.status = status_1;
                if (priority)
                    query.priority = priority;
                if (category)
                    query.category = category;
                if (assignedTo)
                    query.assignedTo = assignedTo;
                sortOption = { createdAt: -1 };
                if (sort === "oldest")
                    sortOption = { createdAt: 1 };
                if (sort === "priority_desc") {
                    // Custom priority sort logic: urgent -> high -> medium -> low
                    sortOption = { priority: 1, createdAt: -1 }; // Mongo enum indexing or alphabetical fallback
                }
                return [4 /*yield*/, ticket_model_1.default.countDocuments(query)];
            case 1:
                total = _b.sent();
                return [4 /*yield*/, ticket_model_1.default.find(query)
                        .sort(sortOption)
                        .skip(skip)
                        .limit(limit)
                        .populate('user', 'name email')
                        .populate('assignedTo', 'name email')];
            case 2:
                tickets = _b.sent();
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
                            sentiment: t.sentiment,
                            tags: t.tags || [],
                            isDuplicate: t.isDuplicate || false,
                            createdAt: t.createdAt,
                            user: t.user ? { id: t.user._id, name: t.user.name || '', email: t.user.email } : null,
                            assignedTo: t.assignedTo ? { id: t.assignedTo._id, name: t.assignedTo.name || '', email: t.assignedTo.email } : null
                        }); })
                    })];
            case 3:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminTickets = getAdminTickets;
// @desc    Admin: Get ticket by ID (detailed)
// @route   GET /api/admin/tickets/:id
// @access  Private/Admin
var getAdminTicketById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ticket, _a, replies, history_1, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, ticket_model_1.default.findById(req.params.id)
                        .populate('user', 'name email')
                        .populate('assignedTo', 'name email')];
            case 1:
                ticket = _b.sent();
                if (!ticket) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
                }
                return [4 /*yield*/, Promise.all([
                        ticket_reply_model_1.default.find({ ticket: ticket._id })
                            .sort({ createdAt: 1 })
                            .populate('sender', 'name email role avatarUrl'),
                        ticket_history_model_1.default.find({ ticket: ticket._id })
                            .sort({ createdAt: -1 })
                            .populate('user', 'name email')
                    ])];
            case 2:
                _a = _b.sent(), replies = _a[0], history_1 = _a[1];
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
                            sentiment: ticket.sentiment,
                            tags: ticket.tags || [],
                            attachments: ticket.attachments || [],
                            suggestedReply: ticket.suggestedReply,
                            isDuplicate: ticket.isDuplicate || false,
                            duplicateOf: ticket.duplicateOf,
                            createdAt: ticket.createdAt,
                            user: ticket.user ? { id: ticket.user._id, name: ticket.user.name || '', email: ticket.user.email } : null,
                            assignedTo: ticket.assignedTo ? { id: ticket.assignedTo._id, name: ticket.assignedTo.name || '', email: ticket.assignedTo.email } : null
                        },
                        replies: replies.map(function (r) { return ({
                            id: r._id,
                            message: r.message,
                            isInternalNote: r.isInternalNote,
                            attachments: r.attachments || [],
                            createdAt: r.createdAt,
                            sender: r.sender ? {
                                id: r.sender._id,
                                name: r.sender.name || '',
                                email: r.sender.email,
                                role: r.sender.role,
                                avatarUrl: r.sender.avatarUrl
                            } : null
                        }); }),
                        history: history_1.map(function (h) { return ({
                            id: h._id,
                            action: h.action,
                            details: h.details,
                            createdAt: h.createdAt,
                            user: h.user ? { id: h.user._id, name: h.user.name || '' } : null
                        }); })
                    })];
            case 3:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminTicketById = getAdminTicketById;
// @desc    Admin: Update ticket status
// @route   PATCH /api/admin/tickets/:id/status
// @access  Private/Admin
var updateTicketStatus = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var status_2, adminUser, ticket, oldStatus, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                status_2 = req.body.status;
                adminUser = req.user;
                return [4 /*yield*/, ticket_model_1.default.findById(req.params.id)];
            case 1:
                ticket = _a.sent();
                if (!ticket) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
                }
                oldStatus = ticket.status;
                ticket.status = status_2;
                return [4 /*yield*/, ticket.save()];
            case 2:
                _a.sent();
                // Log history
                return [4 /*yield*/, ticket_history_model_1.default.create({
                        ticket: ticket._id,
                        user: adminUser._id,
                        action: "status_changed",
                        details: "Changed status from '".concat(oldStatus, "' to '").concat(status_2, "'")
                    })];
            case 3:
                // Log history
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Ticket status updated successfully", status: status_2 })];
            case 4:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateTicketStatus = updateTicketStatus;
// @desc    Admin: Assign ticket
// @route   PATCH /api/admin/tickets/:id/assign
// @access  Private/Admin
var assignTicket = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var assignedTo, adminUser, ticket, agentName, agent, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                assignedTo = req.body.assignedTo;
                adminUser = req.user;
                return [4 /*yield*/, ticket_model_1.default.findById(req.params.id)];
            case 1:
                ticket = _a.sent();
                if (!ticket) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
                }
                agentName = "Unassigned";
                if (!assignedTo) return [3 /*break*/, 3];
                return [4 /*yield*/, user_model_1.default.findById(assignedTo)];
            case 2:
                agent = _a.sent();
                if (!agent) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid agent ID" })];
                }
                ticket.assignedTo = agent._id;
                agentName = agent.name || agent.email;
                return [3 /*break*/, 4];
            case 3:
                ticket.assignedTo = undefined;
                _a.label = 4;
            case 4: return [4 /*yield*/, ticket.save()];
            case 5:
                _a.sent();
                // Log history
                return [4 /*yield*/, ticket_history_model_1.default.create({
                        ticket: ticket._id,
                        user: adminUser._id,
                        action: "ticket_assigned",
                        details: "Assigned ticket to '".concat(agentName, "'")
                    })];
            case 6:
                // Log history
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Ticket assignment updated", assignedTo: assignedTo })];
            case 7:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.assignTicket = assignTicket;
// @desc    Admin: Reply to ticket
// @route   POST /api/admin/tickets/:id/reply
// @access  Private/Admin
var replyToTicket = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, reply_message, isInternalNote, attachments, adminUser, ticket, reply, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, reply_message = _a.reply_message, isInternalNote = _a.isInternalNote, attachments = _a.attachments;
                adminUser = req.user;
                return [4 /*yield*/, ticket_model_1.default.findById(req.params.id)];
            case 1:
                ticket = _b.sent();
                if (!ticket) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
                }
                return [4 /*yield*/, ticket_reply_model_1.default.create({
                        ticket: ticket._id,
                        sender: adminUser._id,
                        message: reply_message.trim(),
                        isInternalNote: !!isInternalNote,
                        attachments: attachments || []
                    })];
            case 2:
                reply = _b.sent();
                if (!!isInternalNote) return [3 /*break*/, 4];
                ticket.status = ticket_model_1.TicketStatus.RESOLVED; // or RESOLVED based on flows
                return [4 /*yield*/, ticket.save()];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: 
            // Log history
            return [4 /*yield*/, ticket_history_model_1.default.create({
                    ticket: ticket._id,
                    user: adminUser._id,
                    action: isInternalNote ? "internal_note_added" : "agent_reply_added",
                    details: isInternalNote ? "Added internal note" : "Added reply to customer"
                })];
            case 5:
                // Log history
                _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        message: "Reply recorded successfully",
                        reply: {
                            id: reply._id,
                            message: reply.message,
                            isInternalNote: reply.isInternalNote,
                            attachments: reply.attachments,
                            createdAt: reply.createdAt,
                            sender: {
                                id: adminUser._id,
                                name: "".concat(adminUser.firstName || '', " ").concat(adminUser.lastName || '').trim(),
                                role: adminUser.role
                            }
                        }
                    })];
            case 6:
                error_5 = _b.sent();
                next(error_5);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.replyToTicket = replyToTicket;
// @desc    Admin: Get statistics of tickets
// @route   GET /api/admin/tickets/stats
// @access  Private/Admin
var getAdminTicketsStats = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var totalTickets, closedTickets, resolvedTickets, openTickets, closureRate, categoryAgg, categoryStats, priorityAgg, priorityStats, sentimentAgg, sentimentStats, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                return [4 /*yield*/, ticket_model_1.default.countDocuments()];
            case 1:
                totalTickets = _a.sent();
                return [4 /*yield*/, ticket_model_1.default.countDocuments({ status: ticket_model_1.TicketStatus.CLOSED })];
            case 2:
                closedTickets = _a.sent();
                return [4 /*yield*/, ticket_model_1.default.countDocuments({ status: ticket_model_1.TicketStatus.RESOLVED })];
            case 3:
                resolvedTickets = _a.sent();
                return [4 /*yield*/, ticket_model_1.default.countDocuments({ status: { $in: [ticket_model_1.TicketStatus.NEW, ticket_model_1.TicketStatus.OPEN] } })];
            case 4:
                openTickets = _a.sent();
                closureRate = totalTickets > 0 ? Math.round(((closedTickets + resolvedTickets) / totalTickets) * 100) : 100;
                return [4 /*yield*/, ticket_model_1.default.aggregate([
                        { $group: { _id: "$category", count: { $sum: 1 } } }
                    ])];
            case 5:
                categoryAgg = _a.sent();
                categoryStats = categoryAgg.reduce(function (acc, curr) {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {});
                return [4 /*yield*/, ticket_model_1.default.aggregate([
                        { $group: { _id: "$priority", count: { $sum: 1 } } }
                    ])];
            case 6:
                priorityAgg = _a.sent();
                priorityStats = priorityAgg.reduce(function (acc, curr) {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {});
                return [4 /*yield*/, ticket_model_1.default.aggregate([
                        { $group: { _id: "$sentiment", count: { $sum: 1 } } }
                    ])];
            case 7:
                sentimentAgg = _a.sent();
                sentimentStats = sentimentAgg.reduce(function (acc, curr) {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {});
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        totalTickets: totalTickets,
                        openTickets: openTickets,
                        resolvedTickets: resolvedTickets,
                        closedTickets: closedTickets,
                        closureRate: closureRate,
                        categoryStats: categoryStats,
                        priorityStats: priorityStats,
                        sentimentStats: sentimentStats
                    })];
            case 8:
                error_6 = _a.sent();
                next(error_6);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.getAdminTicketsStats = getAdminTicketsStats;
