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
exports.replyToOwnTicket = exports.getUserTicketById = exports.getUserTickets = exports.createTicket = void 0;
const ticket_model_1 = __importStar(require("../models/ticket_model"));
const ticket_reply_model_1 = __importDefault(require("../models/ticket_reply_model"));
const ticket_history_model_1 = __importDefault(require("../models/ticket_history_model"));
const AiSupportService_1 = require("../services/AiSupportService");
const api_response_1 = require("../utils/api_response");
const app_error_1 = require("../utils/app_error");
// @desc    User: Create support ticket
// @route   POST /api/tickets
// @access  Public (Optional Auth)
const createTicket = async (req, res, next) => {
    try {
        const { name, email, subject, message, attachments } = req.body;
        const user = req.user;
        if (!name || !email || !subject || !message) {
            throw new app_error_1.AppError({
                code: 'VALIDATION_ERROR',
                statusCode: 400,
                message: 'Name, email, subject, and message are required'
            });
        }
        // Invoke Gemini AI Support Service for classification, priority, sentiment, duplicates, and suggested replies
        const aiSupportService = new AiSupportService_1.AiSupportService();
        const aiResult = await aiSupportService.analyzeTicket(subject, message, email);
        const ticket = await ticket_model_1.default.create({
            user: user ? user._id : undefined,
            name,
            email,
            subject,
            message,
            attachments: attachments || [],
            status: ticket_model_1.TicketStatus.NEW,
            priority: aiResult.priority,
            category: aiResult.category,
            sentiment: aiResult.sentiment,
            suggestedReply: aiResult.suggestedReply,
            isDuplicate: aiResult.isDuplicate,
            duplicateOf: aiResult.duplicateOf
        });
        // If logged in, log to history
        if (user) {
            await ticket_history_model_1.default.create({
                ticket: ticket._id,
                user: user._id,
                action: "ticket_created",
                details: "Ticket created by logged-in user"
            });
        }
        return (0, api_response_1.ok)(res, {
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
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTicket = createTicket;
// @desc    User: Get own tickets list
// @route   GET /api/tickets
// @access  Private
const getUserTickets = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        // Retrieve by authenticated user ID or email
        const query = {
            $or: [
                { user: user._id },
                { email: user.email }
            ],
            deletedAt: null
        };
        const total = await ticket_model_1.default.countDocuments(query);
        const tickets = await ticket_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return (0, api_response_1.ok)(res, {
            total,
            page,
            totalPages: Math.ceil(total / limit),
            tickets: tickets.map((t) => ({
                id: t._id,
                name: t.name,
                email: t.email,
                subject: t.subject,
                message: t.message,
                status: t.status,
                priority: t.priority,
                category: t.category,
                createdAt: t.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserTickets = getUserTickets;
// @desc    User: Get own ticket details & replies
// @route   GET /api/tickets/:id
// @access  Private
const getUserTicketById = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
        }
        const ticket = await ticket_model_1.default.findOne({
            _id: req.params.id,
            $or: [
                { user: user._id },
                { email: user.email }
            ],
            deletedAt: null
        });
        if (!ticket) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found or access denied' });
        }
        // Only get public replies (exclude internal notes)
        const replies = await ticket_reply_model_1.default.find({
            ticket: ticket._id,
            isInternalNote: false
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName lastName role avatarUrl');
        return (0, api_response_1.ok)(res, {
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
            replies: replies.map((r) => ({
                id: r._id,
                message: r.message,
                attachments: r.attachments || [],
                createdAt: r.createdAt,
                sender: r.sender ? {
                    id: r.sender._id,
                    name: `${r.sender.firstName || ''} ${r.sender.lastName || ''}`.trim(),
                    role: r.sender.role,
                    avatarUrl: r.sender.avatarUrl
                } : null
            }))
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserTicketById = getUserTicketById;
// @desc    User: Reply to own ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
const replyToOwnTicket = async (req, res, next) => {
    try {
        const { reply_message, attachments } = req.body;
        const user = req.user;
        if (!user) {
            throw new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
        }
        if (!reply_message || !reply_message.trim()) {
            throw new app_error_1.AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Reply message cannot be empty' });
        }
        const ticket = await ticket_model_1.default.findOne({
            _id: req.params.id,
            $or: [
                { user: user._id },
                { email: user.email }
            ],
            deletedAt: null
        });
        if (!ticket) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found or access denied' });
        }
        // Create the reply (never internal for user replies)
        const reply = await ticket_reply_model_1.default.create({
            ticket: ticket._id,
            sender: user._id,
            message: reply_message.trim(),
            isInternalNote: false,
            attachments: attachments || []
        });
        // Update ticket status to open since user replied and we need to alert agent
        ticket.status = ticket_model_1.TicketStatus.OPEN;
        await ticket.save();
        // Log history
        await ticket_history_model_1.default.create({
            ticket: ticket._id,
            user: user._id,
            action: "user_reply_added",
            details: "Customer added a reply to the ticket"
        });
        return (0, api_response_1.ok)(res, {
            message: "Reply submitted successfully",
            reply: {
                id: reply._id,
                message: reply.message,
                attachments: reply.attachments,
                createdAt: reply.createdAt,
                sender: {
                    id: user._id,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.replyToOwnTicket = replyToOwnTicket;
