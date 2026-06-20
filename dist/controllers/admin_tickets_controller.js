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
exports.getAdminTicketsStats = exports.replyToTicket = exports.assignTicket = exports.updateTicketStatus = exports.getAdminTicketById = exports.getAdminTickets = void 0;
const ticket_model_1 = __importStar(require("../models/ticket_model"));
const ticket_reply_model_1 = __importDefault(require("../models/ticket_reply_model"));
const ticket_history_model_1 = __importDefault(require("../models/ticket_history_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const api_response_1 = require("../utils/api_response");
const app_error_1 = require("../utils/app_error");
// @desc    Admin: Get all tickets globally
// @route   GET /api/admin/tickets
// @access  Private/Admin
const getAdminTickets = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const { search, status, priority, category, assignedTo, sort } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } }
            ];
        }
        if (status)
            query.status = status;
        if (priority)
            query.priority = priority;
        if (category)
            query.category = category;
        if (assignedTo)
            query.assignedTo = assignedTo;
        let sortOption = { createdAt: -1 };
        if (sort === "oldest")
            sortOption = { createdAt: 1 };
        if (sort === "priority_desc") {
            // Custom priority sort logic: urgent -> high -> medium -> low
            sortOption = { priority: 1, createdAt: -1 }; // Mongo enum indexing or alphabetical fallback
        }
        const total = await ticket_model_1.default.countDocuments(query);
        const tickets = await ticket_model_1.default.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email');
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
                sentiment: t.sentiment,
                tags: t.tags || [],
                isDuplicate: t.isDuplicate || false,
                createdAt: t.createdAt,
                user: t.user ? { id: t.user._id, name: t.user.name || '', email: t.user.email } : null,
                assignedTo: t.assignedTo ? { id: t.assignedTo._id, name: t.assignedTo.name || '', email: t.assignedTo.email } : null
            }))
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminTickets = getAdminTickets;
// @desc    Admin: Get ticket by ID (detailed)
// @route   GET /api/admin/tickets/:id
// @access  Private/Admin
const getAdminTicketById = async (req, res, next) => {
    try {
        const ticket = await ticket_model_1.default.findById(req.params.id)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email');
        if (!ticket) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
        }
        // Fetch replies and history in parallel
        const [replies, history] = await Promise.all([
            ticket_reply_model_1.default.find({ ticket: ticket._id })
                .sort({ createdAt: 1 })
                .populate('sender', 'name email role avatarUrl'),
            ticket_history_model_1.default.find({ ticket: ticket._id })
                .sort({ createdAt: -1 })
                .populate('user', 'name email')
        ]);
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
            replies: replies.map((r) => ({
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
            })),
            history: history.map((h) => ({
                id: h._id,
                action: h.action,
                details: h.details,
                createdAt: h.createdAt,
                user: h.user ? { id: h.user._id, name: h.user.name || '' } : null
            }))
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminTicketById = getAdminTicketById;
// @desc    Admin: Update ticket status
// @route   PATCH /api/admin/tickets/:id/status
// @access  Private/Admin
const updateTicketStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const adminUser = req.user;
        const ticket = await ticket_model_1.default.findById(req.params.id);
        if (!ticket) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
        }
        const oldStatus = ticket.status;
        ticket.status = status;
        await ticket.save();
        // Log history
        await ticket_history_model_1.default.create({
            ticket: ticket._id,
            user: adminUser._id,
            action: "status_changed",
            details: `Changed status from '${oldStatus}' to '${status}'`
        });
        return (0, api_response_1.ok)(res, { message: "Ticket status updated successfully", status });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTicketStatus = updateTicketStatus;
// @desc    Admin: Assign ticket
// @route   PATCH /api/admin/tickets/:id/assign
// @access  Private/Admin
const assignTicket = async (req, res, next) => {
    try {
        const { assignedTo } = req.body;
        const adminUser = req.user;
        const ticket = await ticket_model_1.default.findById(req.params.id);
        if (!ticket) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
        }
        let agentName = "Unassigned";
        if (assignedTo) {
            const agent = await user_model_1.default.findById(assignedTo);
            if (!agent) {
                return res.status(400).json({ success: false, message: "Invalid agent ID" });
            }
            ticket.assignedTo = agent._id;
            agentName = agent.name || agent.email;
        }
        else {
            ticket.assignedTo = undefined;
        }
        await ticket.save();
        // Log history
        await ticket_history_model_1.default.create({
            ticket: ticket._id,
            user: adminUser._id,
            action: "ticket_assigned",
            details: `Assigned ticket to '${agentName}'`
        });
        return (0, api_response_1.ok)(res, { message: "Ticket assignment updated", assignedTo });
    }
    catch (error) {
        next(error);
    }
};
exports.assignTicket = assignTicket;
// @desc    Admin: Reply to ticket
// @route   POST /api/admin/tickets/:id/reply
// @access  Private/Admin
const replyToTicket = async (req, res, next) => {
    try {
        const { reply_message, isInternalNote, attachments } = req.body;
        const adminUser = req.user;
        const ticket = await ticket_model_1.default.findById(req.params.id);
        if (!ticket) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
        }
        const reply = await ticket_reply_model_1.default.create({
            ticket: ticket._id,
            sender: adminUser._id,
            message: reply_message.trim(),
            isInternalNote: !!isInternalNote,
            attachments: attachments || []
        });
        // Update ticket status to Replied (if not an internal note)
        if (!isInternalNote) {
            ticket.status = ticket_model_1.TicketStatus.RESOLVED; // or RESOLVED based on flows
            await ticket.save();
        }
        // Log history
        await ticket_history_model_1.default.create({
            ticket: ticket._id,
            user: adminUser._id,
            action: isInternalNote ? "internal_note_added" : "agent_reply_added",
            details: isInternalNote ? "Added internal note" : "Added reply to customer"
        });
        return (0, api_response_1.ok)(res, {
            message: "Reply recorded successfully",
            reply: {
                id: reply._id,
                message: reply.message,
                isInternalNote: reply.isInternalNote,
                attachments: reply.attachments,
                createdAt: reply.createdAt,
                sender: {
                    id: adminUser._id,
                    name: `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim(),
                    role: adminUser.role
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.replyToTicket = replyToTicket;
// @desc    Admin: Get statistics of tickets
// @route   GET /api/admin/tickets/stats
// @access  Private/Admin
const getAdminTicketsStats = async (req, res, next) => {
    try {
        const totalTickets = await ticket_model_1.default.countDocuments();
        const closedTickets = await ticket_model_1.default.countDocuments({ status: ticket_model_1.TicketStatus.CLOSED });
        const resolvedTickets = await ticket_model_1.default.countDocuments({ status: ticket_model_1.TicketStatus.RESOLVED });
        const openTickets = await ticket_model_1.default.countDocuments({ status: { $in: [ticket_model_1.TicketStatus.NEW, ticket_model_1.TicketStatus.OPEN] } });
        const closureRate = totalTickets > 0 ? Math.round(((closedTickets + resolvedTickets) / totalTickets) * 100) : 100;
        // Category distribution
        const categoryAgg = await ticket_model_1.default.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        const categoryStats = categoryAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        // Priority distribution
        const priorityAgg = await ticket_model_1.default.aggregate([
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]);
        const priorityStats = priorityAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        // Sentiment distribution
        const sentimentAgg = await ticket_model_1.default.aggregate([
            { $group: { _id: "$sentiment", count: { $sum: 1 } } }
        ]);
        const sentimentStats = sentimentAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        return (0, api_response_1.ok)(res, {
            totalTickets,
            openTickets,
            resolvedTickets,
            closedTickets,
            closureRate,
            categoryStats,
            priorityStats,
            sentimentStats
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminTicketsStats = getAdminTicketsStats;
