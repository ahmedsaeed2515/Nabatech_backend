import { Request, Response } from "express";
import Message from "../models/message_model";
import { orchestrateChat } from "../services/ai/ai_orchestrator_service";
import { sanitizeErrorMessage, isProviderError } from "../services/ai/ai_errors";
import { validateChatText, validateChatHistory } from "../validation/chat_schemas";
import crypto from "crypto";
import MessageFeedback from "../models/message_feedback_model";

/**
 * Loads recent message history from DB for a given user+conversationId.
 * Returns up to `limit` messages in chronological order (oldest first).
 * This is the server-side memory — it is the ground truth for what was said.
 */
const loadDbHistory = async (
  userId: string,
  conversationId: string,
  limit = 20
): Promise<Array<{ role: string; content: string }>> => {
  try {
    const messages = await Message.find({
      user: userId,
      conversationId,
      role: { $in: ["user", "assistant"] },
      status: "sent",
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    // Reverse to chronological order (oldest first) for LLM context window
    return messages.reverse().map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text,
    }));
  } catch (error) {
    console.warn("Failed to load DB history, proceeding with client history:", sanitizeErrorMessage(error));
    return [];
  }
};

/**
 * Merges server-side DB history with client-sent history.
 * DB history is the ground truth; client history fills gaps for very recent
 * messages that may not yet be committed (optimistic UI sends).
 * Deduplicates by (role, content) to avoid double-injecting the same message.
 */
const mergeHistory = (
  dbHistory: Array<{ role: string; content: string }>,
  clientHistory: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> => {
  if (!dbHistory.length) return clientHistory.slice(-20);
  
  // Build a set of known (role+content) pairs from DB history
  const dbSet = new Set(dbHistory.map((m) => `${m.role}::${m.content.trim()}`));
  
  // Append any client messages NOT already in DB (e.g., very recent unsaved turns)
  const extraFromClient = clientHistory.filter(
    (m) => !dbSet.has(`${m.role}::${m.content.trim()}`)
  );
  
  const merged = [...dbHistory, ...extraFromClient];
  // Bound to last 20 messages (10 turns) for token safety
  return merged.slice(-20);
};

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const text = (req.body?.text || req.body?.question || "").toString();
    const clientHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const topK = Number(req.body?.top_k) || undefined;
    const clientOperationId = req.body?.clientOperationId;
    const language = (req.headers["accept-language"] || req.headers["x-app-language"] || "en").toString().split(",")[0].trim().split("-")[0];

    if (!validateChatText(text)) {
      return res.status(400).json({ success: false, message: "Message is required and must be under 2000 characters" });
    }
    if (!validateChatHistory(clientHistory)) {
      return res.status(400).json({ success: false, message: "Invalid history format or length" });
    }

    const trimmedText = text.trim();
    const userId = (req as any).user.id;
    const requestId = crypto.randomUUID();
    const conversationId = req.body?.conversationId || `conv-${crypto.randomUUID()}`;

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

    // ✅ FIX #1: Load authoritative conversation history from DB
    // This is the memory fix — the server always knows the full conversation,
    // even if the client forgot to send history (e.g., after app restart)
    const tHistoryStart = performance.now();
    const dbHistory = await loadDbHistory(userId, conversationId, 20);
    const history = mergeHistory(dbHistory, clientHistory);
    const tHistoryEnd = performance.now();
    console.log(`[PERF] History Load & Merge: ${(tHistoryEnd - tHistoryStart).toFixed(2)}ms`);

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

    const isSSE = req.headers.accept === "text/event-stream";
    if (isSSE) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
    }

    let chatResult;
    try {
      const tOrchStart = performance.now();
      chatResult = await orchestrateChat({
        userId,
        requestId,
        question: trimmedText,
        history, // ✅ FIX #1: merged DB + client history injected
        topK,
        language,
        onProgress: (phase: string) => {
          if (isSSE) {
            res.write(`data: ${JSON.stringify({ type: "progress", phase })}\n\n`);
          }
        },
        onToken: isSSE
          ? (token: string) => {
              res.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
            }
          : undefined,
      });

      const tOrchEnd = performance.now();
      console.log(`[PERF] Orchestrator: ${(tOrchEnd - tOrchStart).toFixed(2)}ms`);
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
      if (isSSE) {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Chat failed" })}\n\n`);
        return res.end();
      }
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
      sourceIds: [chatResult.provider]
    });

    const finalResponse = {
      success: true,
      message: aiResponse,
      messageId: assistantMsg._id,
      source: chatResult.source,
      provider: { name: chatResult.provider },
      sourceIds: assistantMsg.sourceIds,
      pendingToolCall: (chatResult as any).pendingToolCall
    };

    if (isSSE) {
      res.write(`data: ${JSON.stringify({ type: "result", data: finalResponse })}\n\n`);
      return res.end();
    }

    // Return standard response
    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to process chat message", error });
  }
};

import { AgentToolRegistry } from "../services/ai/agent_tool_registry";
import { getAiSettings } from "../services/ai/ai_config_service";

export const approveToolCall = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { toolName, args } = req.body;
    
    if (!toolName || !args) {
      return res.status(400).json({ success: false, message: "toolName and args are required" });
    }

    const settings = await getAiSettings();
    const registry = new AgentToolRegistry();
    
    // Execute tool directly now that user has approved it
    const result = await registry.executeTool(toolName, args, userId, undefined, settings);
    
    // We expect the tool to return a JSON string with postId and deepLink for create_community_post
    return res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error("Tool approval failed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cursor = req.query.cursor as string;
    const limit = Math.min(Number(req.query.limit) || 50, 50);
    const conversationId = req.query.conversationId as string;

    const query: any = { user: userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }
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
      // ✅ FIX #3: include image fields so image chat messages render correctly
      imageUrl: m.imageUrl,
      diagnosisResult: m.diagnosisResult,
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

export const getChatSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(Number(req.query.limit) || 20, 20);

    // Group messages by conversationId, get the most recent message for each session
    const sessions = await Message.aggregate([
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
    ]);

    const payload = sessions.map(s => ({
      conversationId: s._id,
      title: s.lastMessage,
      updatedAt: s.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    console.error("Failed to fetch chat sessions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch chat sessions", error });
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
    if (filterUserId) match.user = filterUserId;
    if (statusFilter) match.status = statusFilter;
    if (q) match.text = new RegExp(`^${q}`, "i"); // Prefix search

    const pipeline: any[] = [];
    
    if (Object.keys(match).length > 0) {
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
      const cursorDate = new Date(Number(cursor));
      if (!isNaN(cursorDate.getTime())) {
        pipeline.push({ $match: { lastMessageAt: { $lt: cursorDate } } });
      }
    }

    pipeline.push({ $sort: { lastMessageAt: -1 } });
    pipeline.push({ $limit: limit });

    const conversations = await Message.aggregate(pipeline);

    const formattedConversations = conversations.map(c => ({
      userId: c.userId,
      conversationId: c._id,
      messageCount: c.messageCount,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      hasImageMessages: Boolean(c.hasImageMessages),
      messages: c.messages.slice(0, 5).reverse() 
    }));

    const nextCursor = formattedConversations.length === limit 
      ? new Date(formattedConversations[formattedConversations.length - 1].lastMessageAt).getTime() 
      : null;

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

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { messageId, rating, textFeedback, isHallucination, category } = req.body;

    if (!messageId || !rating) {
      return res.status(400).json({ success: false, message: "messageId and rating are required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Upsert feedback
    const feedback = await MessageFeedback.findOneAndUpdate(
      { message: messageId, user: userId },
      { rating, textFeedback, isHallucination: Boolean(isHallucination), category },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, feedback });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return res.status(500).json({ success: false, message: "Failed to submit feedback", error });
  }
};


