import { Request, Response } from "express";
import Message from "../models/message_model";
import { orchestrateChat } from "../services/ai/ai_orchestrator_service";
import { sanitizeErrorMessage } from "../services/ai/ai_errors";

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const text = (req.body?.text || req.body?.question || "").toString();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const topK = Number(req.body?.top_k) || undefined;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Message required" });
    }

    const trimmedText = text.trim();

    // Create a MongoDB Message log for user query
    const userMsg = await Message.create({
      user: (req as any).user.id,
      sender: "user",
      text: trimmedText
    });

    const chatResult = await orchestrateChat({
      userId: (req as any).user.id,
      question: trimmedText,
      history,
      topK,
    });
    const aiResponse = chatResult.message;

    // Create a MongoDB Message log for the AI response
    await Message.create({
      user: (req as any).user.id,
      sender: "llm",
      text: aiResponse
    });

    // Return response with success and message fields
    return res.status(200).json({
      success: true,
      message: aiResponse,
      source: chatResult.source,
      provider: { name: chatResult.provider },
    });

  } catch (error: unknown) {
    console.error("Chat failure:", sanitizeErrorMessage(error));
    return res.status(502).json({ success: false, message: "Chat failed" });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const messages = await Message.find({ user: userId }).sort({ createdAt: 1 });

    const payload = messages.map(m => ({
      id: m._id,
      sender: m.sender,
      text: m.text,
      createdAt: m.createdAt
    }));

    res.json({
      success: true,
      messages: payload
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch chat history", error });
  }
};

export const getAllChatLogs = async (req: Request, res: Response) => {
  try {
    // FIXED: Retrieve messages in chronological order so we can group them in order
    const messages = await Message.find()
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    const conversationsMap = new Map<string, any>();

    for (const msg of messages) {
      if (!msg.user) continue;
      const userId = (msg.user as any)._id.toString();
      const userName = (msg.user as any).name || "Deleted User";

      if (!conversationsMap.has(userId)) {
        conversationsMap.set(userId, {
          userId,
          userName,
          messageCount: 0,
          lastMessage: "",
          lastMessageAt: "",
          messages: [],
        });
      }

      const conv = conversationsMap.get(userId);
      conv.messageCount++;
      conv.lastMessage = msg.text;
      conv.lastMessageAt = msg.createdAt ? msg.createdAt.toISOString() : new Date().toISOString();
      conv.messages.push({
        role: msg.sender === "llm" ? "assistant" : "user",
        content: msg.text,
        timestamp: msg.createdAt ? msg.createdAt.toISOString() : new Date().toISOString(),
      });
    }

    // Convert map to sorted conversations array (most recent lastMessageAt first)
    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    // Form flat list for backwards compatibility
    const flatMessagesList = [...messages].reverse().slice(0, 100).map(m => ({
      id: m._id,
      user: m.user,
      sender: m.sender,
      text: m.text,
      createdAt: m.createdAt
    }));

    res.status(200).json({
      success: true,
      conversations,
      messages: flatMessagesList // Backwards-compatibility envelope
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch chat logs", error });
  }
};
