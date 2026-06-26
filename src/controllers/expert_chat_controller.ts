import { Request, Response, NextFunction } from "express";
import ExpertChatSession from "../models/expert_chat_session_model";
import ExpertChatMessage from "../models/expert_chat_message_model";
import { AppError } from "../utils/app_error";

// @desc    Init or get existing active chat session
// @route   POST /api/experts/chat/init
// @access  Private
export const initExpertChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmerId = (req as any).user.id;
    const { expertId } = req.body;

    if (!expertId) {
      return next(new AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Expert ID is required' }));
    }

    let session = await ExpertChatSession.findOne({ farmerId, expertId, status: "active" });

    if (!session) {
      session = await ExpertChatSession.create({ farmerId, expertId });
    }

    res.status(200).json({
      success: true,
      data: { sessionId: session._id }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a session
// @route   GET /api/experts/chat/:sessionId/messages
// @access  Private
export const getExpertMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    const session = await ExpertChatSession.findById(sessionId);
    if (!session) {
      return next(new AppError({ code: 'NOT_FOUND', statusCode: 404, message: 'Session not found' }));
    }

    if (session.farmerId.toString() !== userId && session.expertId.toString() !== userId) {
      return next(new AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Access denied' }));
    }

    const messages = await ExpertChatMessage.find({ sessionId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a session
// @route   POST /api/experts/chat/:sessionId/messages
// @access  Private
export const sendExpertMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return next(new AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Message is required' }));
    }

    const session = await ExpertChatSession.findById(sessionId);
    if (!session || session.status !== 'active') {
      return next(new AppError({ code: 'INVALID_STATE', statusCode: 400, message: 'Active session not found' }));
    }

    if (session.farmerId.toString() !== userId && session.expertId.toString() !== userId) {
      return next(new AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Access denied' }));
    }

    const newMessage = await ExpertChatMessage.create({
      sessionId,
      senderId: userId,
      message: message.trim()
    });

    res.status(201).json({
      success: true,
      data: { message: newMessage }
    });
  } catch (error) {
    next(error);
  }
};


