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
exports.streamEscalations = exports.resolveEscalation = exports.claimEscalation = exports.getEscalations = exports.updateMyExpertProfile = exports.getExpertProfile = void 0;
const expert_profile_model_1 = __importDefault(require("../models/expert_profile_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const app_error_1 = require("../utils/app_error");
// @desc    Get expert profile by userId
// @route   GET /api/experts/:id
// @access  Private
const getExpertProfile = async (req, res, next) => {
    try {
        const expertId = req.params.id;
        const user = await user_model_1.default.findById(expertId).select('name email role avatarUrl createdAt');
        if (!user) {
            return next(new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'User not found' }));
        }
        if (user.role !== 'expert') {
            return next(new app_error_1.AppError({ code: 'INVALID_ROLE', statusCode: 400, message: 'User is not an expert' }));
        }
        const profile = await expert_profile_model_1.default.findOne({ userId: expertId });
        const recentPosts = await community_post_model_1.default.find({ author: expertId, status: 'visible' })
            .sort({ createdAt: -1 })
            .limit(5);
        res.status(200).json({
            success: true,
            data: {
                expert: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    joinedAt: user.createdAt,
                    role: user.role,
                },
                profile: profile || null,
                recentPosts: recentPosts.map(p => ({
                    id: p._id,
                    title: p.title,
                    content: p.content,
                    plantTag: p.plantTag,
                    commentsCount: p.commentsCount,
                    likesCount: p.likes,
                    createdAt: p.createdAt,
                })),
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpertProfile = getExpertProfile;
// @desc    Update current expert's profile
// @route   PUT /api/experts/me/profile
// @access  Private (Expert only)
const updateMyExpertProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bio, specialization, yearsExperience } = req.body;
        // Verify role
        const user = await user_model_1.default.findById(userId);
        if (!user || user.role !== 'expert') {
            return next(new app_error_1.AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Only experts can have profiles' }));
        }
        const profile = await expert_profile_model_1.default.findOneAndUpdate({ userId }, { $set: { bio, specialization, yearsExperience } }, { new: true, upsert: true, runValidators: true });
        res.status(200).json({
            success: true,
            data: { profile }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMyExpertProfile = updateMyExpertProfile;
// @desc    Get all escalations
// @route   GET /api/experts/admin/escalations
// @access  Private (Admin/Expert)
const getEscalations = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status)
            query.status = status;
        const ExpertEscalation = (await Promise.resolve().then(() => __importStar(require("../models/expert_escalation_model")))).default;
        const escalations = await ExpertEscalation.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: { escalations }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEscalations = getEscalations;
// @desc    Claim an escalation
// @route   POST /api/experts/admin/escalations/:id/claim
// @access  Private (Admin/Expert)
const claimEscalation = async (req, res, next) => {
    try {
        const adminId = req.user.id;
        const escalationId = req.params.id;
        const ExpertEscalation = (await Promise.resolve().then(() => __importStar(require("../models/expert_escalation_model")))).default;
        const escalation = await ExpertEscalation.findById(escalationId);
        if (!escalation) {
            return next(new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Escalation not found' }));
        }
        if (escalation.status !== "pending") {
            return next(new app_error_1.AppError({ code: 'INVALID_STATE', statusCode: 400, message: 'Escalation is already claimed or resolved' }));
        }
        escalation.status = "claimed";
        escalation.assignedAdminId = adminId;
        await escalation.save();
        // Broadcast update via SSE
        broadcastEscalationEvent('claimed', escalation);
        res.status(200).json({
            success: true,
            data: { escalation }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.claimEscalation = claimEscalation;
// @desc    Resolve an escalation
// @route   POST /api/experts/admin/escalations/:id/resolve
// @access  Private (Admin/Expert)
const resolveEscalation = async (req, res, next) => {
    try {
        const adminId = req.user.id;
        const escalationId = req.params.id;
        const { response } = req.body;
        if (!response) {
            return next(new app_error_1.AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Response is required' }));
        }
        const ExpertEscalation = (await Promise.resolve().then(() => __importStar(require("../models/expert_escalation_model")))).default;
        const escalation = await ExpertEscalation.findById(escalationId);
        if (!escalation) {
            return next(new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Escalation not found' }));
        }
        if (escalation.status !== "claimed" || escalation.assignedAdminId !== adminId) {
            return next(new app_error_1.AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'You must claim this escalation before resolving it' }));
        }
        escalation.status = "resolved";
        escalation.expertResponse = response;
        escalation.expertId = adminId;
        await escalation.save();
        // Broadcast update via SSE
        broadcastEscalationEvent('resolved', escalation);
        res.status(200).json({
            success: true,
            data: { escalation }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resolveEscalation = resolveEscalation;
// --- SSE Implementation for Real-Time Updates ---
let sseClients = [];
const streamEscalations = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE
    // Tell the client we connected successfully
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    sseClients.push(res);
    req.on('close', () => {
        sseClients = sseClients.filter(client => client !== res);
    });
};
exports.streamEscalations = streamEscalations;
const broadcastEscalationEvent = (type, data) => {
    const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
    sseClients.forEach(client => {
        try {
            client.write(payload);
        }
        catch (e) {
            console.warn("Error sending SSE to client", e);
        }
    });
};
