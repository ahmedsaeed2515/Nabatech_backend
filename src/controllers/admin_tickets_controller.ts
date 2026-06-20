import { Request, Response, NextFunction } from "express";
import Ticket, { TicketStatus, TicketPriority } from "../models/ticket_model";
import TicketReply from "../models/ticket_reply_model";
import TicketHistory from "../models/ticket_history_model";
import User from "../models/user_model";
import { ok } from "../utils/api_response";
import { AppError } from "../utils/app_error";

// @desc    Admin: Get all tickets globally
// @route   GET /api/admin/tickets
// @access  Private/Admin
export const getAdminTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { search, status, priority, category, assignedTo, sort } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    let sortOption: any = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "priority_desc") {
      // Custom priority sort logic: urgent -> high -> medium -> low
      sortOption = { priority: 1, createdAt: -1 }; // Mongo enum indexing or alphabetical fallback
    }

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    return ok(res, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      tickets: tickets.map((t: any) => ({
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
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get ticket by ID (detailed)
// @route   GET /api/admin/tickets/:id
// @access  Private/Admin
export const getAdminTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
    }

    // Fetch replies and history in parallel
    const [replies, history] = await Promise.all([
      TicketReply.find({ ticket: ticket._id })
        .sort({ createdAt: 1 })
        .populate('sender', 'name email role avatarUrl'),
      TicketHistory.find({ ticket: ticket._id })
        .sort({ createdAt: -1 })
        .populate('user', 'name email')
    ]);

    return ok(res, {
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
        user: ticket.user ? { id: (ticket.user as any)._id, name: (ticket.user as any).name || '', email: (ticket.user as any).email } : null,
        assignedTo: ticket.assignedTo ? { id: (ticket.assignedTo as any)._id, name: (ticket.assignedTo as any).name || '', email: (ticket.assignedTo as any).email } : null
      },
      replies: replies.map((r: any) => ({
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
      history: history.map((h: any) => ({
        id: h._id,
        action: h.action,
        details: h.details,
        createdAt: h.createdAt,
        user: h.user ? { id: h.user._id, name: h.user.name || '' } : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update ticket status
// @route   PATCH /api/admin/tickets/:id/status
// @access  Private/Admin
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const adminUser = (req as any).user;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
    }

    const oldStatus = ticket.status;
    ticket.status = status as TicketStatus;
    await ticket.save();

    // Log history
    await TicketHistory.create({
      ticket: ticket._id,
      user: adminUser._id,
      action: "status_changed",
      details: `Changed status from '${oldStatus}' to '${status}'`
    });

    return ok(res, { message: "Ticket status updated successfully", status });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Assign ticket
// @route   PATCH /api/admin/tickets/:id/assign
// @access  Private/Admin
export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignedTo } = req.body;
    const adminUser = (req as any).user;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
    }

    let agentName = "Unassigned";
    if (assignedTo) {
      const agent = await User.findById(assignedTo);
      if (!agent) {
        return res.status(400).json({ success: false, message: "Invalid agent ID" });
      }
      ticket.assignedTo = agent._id as any;
      agentName = agent.name || agent.email;
    } else {
      ticket.assignedTo = undefined;
    }

    await ticket.save();

    // Log history
    await TicketHistory.create({
      ticket: ticket._id,
      user: adminUser._id,
      action: "ticket_assigned",
      details: `Assigned ticket to '${agentName}'`
    });

    return ok(res, { message: "Ticket assignment updated", assignedTo });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Reply to ticket
// @route   POST /api/admin/tickets/:id/reply
// @access  Private/Admin
export const replyToTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reply_message, isInternalNote, attachments } = req.body;
    const adminUser = (req as any).user;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found' });
    }

    const reply = await TicketReply.create({
      ticket: ticket._id,
      sender: adminUser._id,
      message: reply_message.trim(),
      isInternalNote: !!isInternalNote,
      attachments: attachments || []
    });

    // Update ticket status to Replied (if not an internal note)
    if (!isInternalNote) {
      ticket.status = TicketStatus.RESOLVED; // or RESOLVED based on flows
      await ticket.save();
    }

    // Log history
    await TicketHistory.create({
      ticket: ticket._id,
      user: adminUser._id,
      action: isInternalNote ? "internal_note_added" : "agent_reply_added",
      details: isInternalNote ? "Added internal note" : "Added reply to customer"
    });

    return ok(res, {
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
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get statistics of tickets
// @route   GET /api/admin/tickets/stats
// @access  Private/Admin
export const getAdminTicketsStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const closedTickets = await Ticket.countDocuments({ status: TicketStatus.CLOSED });
    const resolvedTickets = await Ticket.countDocuments({ status: TicketStatus.RESOLVED });
    const openTickets = await Ticket.countDocuments({ status: { $in: [TicketStatus.NEW, TicketStatus.OPEN] } });

    const closureRate = totalTickets > 0 ? Math.round(((closedTickets + resolvedTickets) / totalTickets) * 100) : 100;

    // Category distribution
    const categoryAgg = await Ticket.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const categoryStats = categoryAgg.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Priority distribution
    const priorityAgg = await Ticket.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);
    const priorityStats = priorityAgg.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Sentiment distribution
    const sentimentAgg = await Ticket.aggregate([
      { $group: { _id: "$sentiment", count: { $sum: 1 } } }
    ]);
    const sentimentStats = sentimentAgg.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return ok(res, {
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      closureRate,
      categoryStats,
      priorityStats,
      sentimentStats
    });
  } catch (error) {
    next(error);
  }
};
