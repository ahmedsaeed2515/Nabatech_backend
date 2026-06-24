"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpertMessage = exports.getExpertMessages = exports.initExpertChat = void 0;
const expert_chat_session_model_1 = __importDefault(require("../models/expert_chat_session_model"));
const expert_chat_message_model_1 = __importDefault(require("../models/expert_chat_message_model"));
const app_error_1 = require("../utils/app_error");
// @desc    Init or get existing active chat session
// @route   POST /api/experts/chat/init
// @access  Private
const initExpertChat = async (req, res, next) => {
    try {
        const farmerId = req.user.id;
        const { expertId } = req.body;
        if (!expertId) {
            return next(new app_error_1.AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Expert ID is required' }));
        }
        let session = await expert_chat_session_model_1.default.findOne({ farmerId, expertId, status: "active" });
        if (!session) {
            session = await expert_chat_session_model_1.default.create({ farmerId, expertId });
        }
        res.status(200).json({
            success: true,
            data: { sessionId: session._id }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.initExpertChat = initExpertChat;
// @desc    Get messages for a session
// @route   GET /api/experts/chat/:sessionId/messages
// @access  Private
const getExpertMessages = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const session = await expert_chat_session_model_1.default.findById(sessionId);
        if (!session) {
            return next(new app_error_1.AppError({ code: 'NOT_FOUND', statusCode: 404, message: 'Session not found' }));
        }
        if (session.farmerId.toString() !== userId && session.expertId.toString() !== userId) {
            return next(new app_error_1.AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Access denied' }));
        }
        const messages = await expert_chat_message_model_1.default.find({ sessionId }).sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            data: { messages }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpertMessages = getExpertMessages;
// @desc    Send a message in a session
// @route   POST /api/experts/chat/:sessionId/messages
// @access  Private
const sendExpertMessage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const { message } = req.body;
        if (!message || !message.trim()) {
            return next(new app_error_1.AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Message is required' }));
        }
        const session = await expert_chat_session_model_1.default.findById(sessionId);
        if (!session || session.status !== 'active') {
            return next(new app_error_1.AppError({ code: 'INVALID_STATE', statusCode: 400, message: 'Active session not found' }));
        }
        if (session.farmerId.toString() !== userId && session.expertId.toString() !== userId) {
            return next(new app_error_1.AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Access denied' }));
        }
        const newMessage = await expert_chat_message_model_1.default.create({
            sessionId,
            senderId: userId,
            message: message.trim()
        });
        res.status(201).json({
            success: true,
            data: { message: newMessage }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendExpertMessage = sendExpertMessage;
