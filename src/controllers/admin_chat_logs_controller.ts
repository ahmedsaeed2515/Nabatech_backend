import { Request, Response, NextFunction } from "express";
import Conversation from "../models/conversation_model";
import Message from "../models/message_model";
import ChatSession from "../models/chat_session_model";
import AiToolCall from "../models/ai_tool_call_model";
import AiCallLog from "../models/ai_call_log_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { ok } from "../utils/api_response";
import { AppError } from "../utils/app_error";

// @desc    Admin: Get all chat logs (conversations)
// @route   GET /api/admin/chat-logs
export const getChatLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .populate("user", "name email avatarUrl")
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Conversation.countDocuments(query);

    return ok(res, {
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get single conversation with messages & tool calls
// @route   GET /api/admin/chat-logs/:id
export const getChatLogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = req.params.id;

    // We can also fetch using the string conversationId from Message model if legacy
    let conversation = await Conversation.findById(conversationId).populate("user", "name email");
    
    // Fetch messages
    const messagesQuery = conversation ? { conversationId: conversation._id.toString() } : { conversationId };
    const messages = await Message.find(messagesQuery).sort({ createdAt: 1 });

    // Fetch tool calls
    const toolCalls = await AiToolCall.find({ conversationId: conversation ? conversation._id : null }).sort({ createdAt: 1 });

    return ok(res, {
      conversation,
      messages,
      toolCalls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get chat sessions
// @route   GET /api/admin/chat-sessions
export const getChatSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const sessions = await ChatSession.find()
      .populate("user", "name email")
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ChatSession.countDocuments();

    return ok(res, {
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get chat analytics (observability)
// @route   GET /api/admin/chat-analytics
export const getChatAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    const tokenAgg = await ChatSession.aggregate([
      { $group: { _id: null, totalTokens: { $sum: "$totalTokensUsed" } } }
    ]);
    const totalTokensUsed = tokenAgg[0]?.totalTokens || 0;

    const latencyAgg = await AiCallLog.aggregate([
      { $group: { _id: null, avgLatency: { $avg: "$latencyMs" } } }
    ]);
    const avgLatencyMs = latencyAgg[0]?.avgLatency || 0;

    const failuresAgg = await AiCallLog.aggregate([
      { $match: { status: "failure" } },
      { $count: "failures" }
    ]);
    const totalFailures = failuresAgg[0]?.failures || 0;

    const modelAgg = await AiCallLog.aggregate([
      { $group: { _id: "$provider", count: { $sum: 1 } } }
    ]);

    return ok(res, {
      totalConversations,
      totalMessages,
      totalTokensUsed,
      avgLatencyMs,
      totalFailures,
      modelUsage: modelAgg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get chat tool calls
// @route   GET /api/admin/chat-tool-calls
export const getChatToolCalls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const toolCalls = await AiToolCall.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AiToolCall.countDocuments();

    // Usage counts
    const countsAgg = await AiToolCall.aggregate([
      { $group: { _id: "$toolName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return ok(res, {
      toolCalls,
      toolCounts: countsAgg,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get chat diagnoses history
// @route   GET /api/admin/chat-diagnoses
export const getChatDiagnoses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const diagnoses = await DiagnosisHistory.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await DiagnosisHistory.countDocuments();

    return ok(res, {
      diagnoses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


