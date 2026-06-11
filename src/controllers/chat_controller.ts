import { Request, Response } from "express";
import Message from "../models/message_model";
import { orchestrateChat } from "../services/ai/ai_orchestrator_service";
import { sanitizeErrorMessage, isProviderError } from "../services/ai/ai_errors";
import { validateChatText, validateChatHistory } from "../validation/chat_schemas";
import crypto from "crypto";

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const text = (req.body?.text || req.body?.question || "").toString();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const topK = Number(req.body?.top_k) || undefined;
    const clientOperationId = req.body?.clientOperationId;

    if (!validateChatText(text)) {
      return res.status(400).json({ success: false, message: "Message is required and must be under 2000 characters" });
    }
    if (!validateChatHistory(history)) {
      return res.status(400).json({ success: false, message: "Invalid history format or length" });
    }

    const trimmedText = text.trim();
    const userId = (req as any).user.id;
    const requestId = crypto.randomUUID();

    if (clientOperationId) {
      const existing = await Message.findOne({ user: userId, clientOperationId, role: "assistant" });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: existing.text,
          messageId: existing._id,
          source: existing.source,
          provider: { name: existing.provider },
          sourceIds: existing.sourceIds,
        });
      }
    }

    // Default conversation for legacy or new ones without specific ID in this design
    const conversationId = `conv-${userId}`; 

    // Create a MongoDB Message log for user query
    await Message.create({
      user: userId,
      sender: "user", // Legacy
      role: "user",
      text: trimmedText,
      conversationId,
      requestId,
      status: "sent"
    });

    let chatResult;
    try {
      chatResult = await orchestrateChat({
        userId,
        requestId,
        question: trimmedText,
        history,
        topK,
      });
    } catch (aiError) {
      // Record failed assistant response
      await Message.create({
        user: userId,
        sender: "llm", // Legacy
        role: "assistant",
        text: "Sorry, I am unable to respond at this time.",
        conversationId,
        requestId,
        clientOperationId,
        status: "failed",
        errorCode: "PROVIDER_UNAVAILABLE"
      });
      console.error("Chat orchestration failure:", sanitizeErrorMessage(aiError));
      return res.status(502).json({ success: false, message: "Chat failed" });
    }

    const aiResponse = chatResult.message;

    // Create a MongoDB Message log for the AI response
    const assistantMsg = await Message.create({
      user: userId,
      sender: "llm", // Legacy
      role: "assistant",
      text: aiResponse,
      conversationId,
      requestId,
      clientOperationId,
      status: "sent",
      provider: chatResult.provider,
      source: chatResult.source,
      sourceIds: [chatResult.provider] // Simplified sourceIds based on provider chain
    });

    // Return response with success and message fields
    return res.status(200).json({
      success: true,
      message: aiResponse,
      messageId: assistantMsg._id,
      source: chatResult.source,
      provider: { name: chatResult.provider },
      sourceIds: assistantMsg.sourceIds
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch chat history", error });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cursor = req.query.cursor as string;
    const limit = Math.min(Number(req.query.limit) || 50, 50);

    const query: any = { user: userId };
    if (cursor) {
      const cursorMsg = await Message.findById(cursor);
      if (!cursorMsg) {
        return res.status(400).json({ success: false, message: "VALIDATION_FAILED: Invalid cursor" });
      }
      query.$or = [
        { createdAt: { $lt: cursorMsg.createdAt } },
        { createdAt: cursorMsg.createdAt, _id: { $lt: cursor } }
      ];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);

    // Return in chronological order for display
    const sorted = messages.reverse();

    const payload = sorted.map(m => ({
      id: m._id,
      sender: m.sender,
      role: m.role || (m.sender === "llm" ? "assistant" : "user"),
      text: m.text,
      status: m.status || "sent",
      provider: m.provider,
      source: m.source,
      sourceIds: m.sourceIds,
      createdAt: m.createdAt
    }));

    const nextCursor = messages.length === limit ? messages[0]._id : null;

    return res.status(200).json({
      success: true,
      data: {
        items: payload,
        pageInfo: { nextCursor, hasNextPage: !!nextCursor }
      },
      messages: payload // Legacy fallback
    });
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch chat history", error });
  }
};

export const getAllChatLogs = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 50);
    const cursor = req.query.cursor as string;
    const filterUserId = req.query.userId as string;
    const statusFilter = req.query.status as string;
    const q = req.query.q as string;

    const match: any = {};
    if (filterUserId) match.user = filterUserId; // Mongoose aggregate auto-casts if possible, but let's be careful
    if (statusFilter) match.status = statusFilter;
    if (q) match.text = new RegExp(`^${q}`, "i"); // Prefix search

    const pipeline: any[] = [];
    
    // Avoid full scan if possible, but $match is the only way here.
    if (Object.keys(match).length > 0) {
      // Manual ObjectId casting for user since aggregate doesn't always auto-cast
      if (match.user) {
         const mongoose = require("mongoose");
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
        messages: { 
          $push: { 
            role: { $ifNull: ["$role", { $cond: [{ $eq: ["$sender", "llm"] }, "assistant", "user"] }] }, 
            content: "$text", 
            timestamp: "$createdAt" 
          } 
        }
      }
    });

    if (cursor) {
      const cursorDate = new Date(Number(cursor));
      if (!isNaN(cursorDate.getTime())) {
        pipeline.push({ $match: { lastMessageAt: { $lt: cursorDate } } });
      }
    }

    pipeline.push({ $sort: { lastMessageAt: -1 } });
    pipeline.push({ $limit: limit });

    const conversations = await Message.aggregate(pipeline);

    // Limit the embedded messages for unbounded previews
    const formattedConversations = conversations.map(c => ({
      userId: c.userId,
      conversationId: c._id,
      messageCount: c.messageCount,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      // Reverse back to chronological order and bound to 5 latest
      messages: c.messages.slice(0, 5).reverse() 
    }));

    const nextCursor = formattedConversations.length === limit 
      ? new Date(formattedConversations[formattedConversations.length - 1].lastMessageAt).getTime() 
      : null;

    // Provide flat messages list for legacy fallback
    const flatMessagesList = conversations.flatMap(c => c.messages).slice(0, 50);

    return res.status(200).json({
      success: true,
      data: {
        conversations: formattedConversations,
        pageInfo: { nextCursor, hasNextPage: !!nextCursor }
      },
      conversations: formattedConversations, // Legacy envelope
      messages: flatMessagesList // Legacy fallback
    });
  } catch (error) {
    console.error("Failed to fetch chat logs:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch chat logs", error });
  }
};
