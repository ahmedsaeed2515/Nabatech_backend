import { Request, Response, NextFunction } from "express";
import Ticket, { TicketStatus, TicketPriority } from "../models/ticket_model";
import TicketReply from "../models/ticket_reply_model";
import TicketHistory from "../models/ticket_history_model";
import { AiSupportService } from "../services/AiSupportService";
import { ok } from "../utils/api_response";
import { AppError } from "../utils/app_error";

// @desc    User: Create support ticket
// @route   POST /api/tickets
// @access  Public (Optional Auth)
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, subject, message, attachments } = req.body;
    const user = (req as any).user;

    if (!name || !email || !subject || !message) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'Name, email, subject, and message are required'
      });
    }

    // Invoke Gemini AI Support Service for classification, priority, sentiment, duplicates, and suggested replies
    const aiSupportService = new AiSupportService();
    const aiResult = await aiSupportService.analyzeTicket(subject, message, email);

    const ticket = await Ticket.create({
      user: user ? user._id : undefined,
      name,
      email,
      subject,
      message,
      attachments: attachments || [],
      status: TicketStatus.NEW,
      priority: aiResult.priority,
      category: aiResult.category,
      sentiment: aiResult.sentiment,
      suggestedReply: aiResult.suggestedReply,
      isDuplicate: aiResult.isDuplicate,
      duplicateOf: aiResult.duplicateOf
    });

    // If logged in, log to history
    if (user) {
      await TicketHistory.create({
        ticket: ticket._id,
        user: user._id,
        action: "ticket_created",
        details: "Ticket created by logged-in user"
      });
    }

    return ok(res, {
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
  } catch (error) {
    next(error);
  }
};

// @desc    User: Get own tickets list
// @route   GET /api/tickets
// @access  Private
export const getUserTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    // Retrieve by authenticated user ID or email
    const query = {
      $or: [
        { user: user._id },
        { email: user.email }
      ],
      deletedAt: null
    };

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User: Get own ticket details & replies
// @route   GET /api/tickets/:id
// @access  Private
export const getUserTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      $or: [
        { user: user._id },
        { email: user.email }
      ],
      deletedAt: null
    });

    if (!ticket) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found or access denied' });
    }

    // Only get public replies (exclude internal notes)
    const replies = await TicketReply.find({
      ticket: ticket._id,
      isInternalNote: false
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName role avatarUrl');

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
        attachments: ticket.attachments || [],
        createdAt: ticket.createdAt
      },
      replies: replies.map((r: any) => ({
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
  } catch (error) {
    next(error);
  }
};

// @desc    User: Reply to own ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
export const replyToOwnTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reply_message, attachments } = req.body;
    const user = (req as any).user;

    if (!user) {
      throw new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Authentication required' });
    }

    if (!reply_message || !reply_message.trim()) {
      throw new AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Reply message cannot be empty' });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      $or: [
        { user: user._id },
        { email: user.email }
      ],
      deletedAt: null
    });

    if (!ticket) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Ticket not found or access denied' });
    }

    // Create the reply (never internal for user replies)
    const reply = await TicketReply.create({
      ticket: ticket._id,
      sender: user._id,
      message: reply_message.trim(),
      isInternalNote: false,
      attachments: attachments || []
    });

    // Update ticket status to open since user replied and we need to alert agent
    ticket.status = TicketStatus.OPEN;
    await ticket.save();

    // Log history
    await TicketHistory.create({
      ticket: ticket._id,
      user: user._id,
      action: "user_reply_added",
      details: "Customer added a reply to the ticket"
    });

    return ok(res, {
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
  } catch (error) {
    next(error);
  }
};


