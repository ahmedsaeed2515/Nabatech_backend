import { Request, Response } from "express";
import Message from "../models/message_model";
import { askAI } from "../utils/ai";
import axios from "axios";

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

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

    let aiResponse = "";
    try {
      const response = await axios.post(
        "https://ahmedsaeed111-agrirag-pro.hf.space/ask",
        {
          question: trimmedText,
          history: [],
          top_k: 8
        },
        {
          timeout: 20000 // 20 seconds timeout
        }
      );

      const data = (response.data || {}) as any;
      aiResponse = (data.answer || data.response || data.result || "").toString().trim();

      if (!aiResponse) {
        throw new Error("Received empty response from AgriRAG space");
      }
    } catch (error) {
      console.warn("AgriRAG request failed or timed out. Falling back to OpenAI (gpt-4o-mini):", error);
      aiResponse = await askAI(trimmedText);
    }

    // Create a MongoDB Message log for the AI response
    await Message.create({
      user: (req as any).user.id,
      sender: "llm",
      text: aiResponse
    });

    // Return response with success and message fields
    return res.status(200).json({
      success: true,
      message: aiResponse
    });

  } catch (error) {
    console.error("Chat failure:", error);
    return res.status(500).json({ message: "Chat failed", error });
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
    const messages = await Message.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      messages: messages.map(m => ({
        id: m._id,
        user: m.user,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch chat logs", error });
  }
};