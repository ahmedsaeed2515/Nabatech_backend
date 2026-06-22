import { Request, Response, NextFunction } from 'express';
import ExpertProfile from '../models/expert_profile_model';
import User from '../models/user_model';
import CommunityPost from '../models/community_post_model';
import { AppError } from '../utils/app_error';
import { formatRelativeTime } from './community_controller';

// @desc    Get expert profile by userId
// @route   GET /api/experts/:id
// @access  Private
export const getExpertProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expertId = req.params.id;

    const user = await User.findById(expertId).select('name email role avatarUrl createdAt');
    if (!user) {
      return next(new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'User not found' }));
    }

    if (user.role !== 'expert') {
      return next(new AppError({ code: 'INVALID_ROLE', statusCode: 400, message: 'User is not an expert' }));
    }

    const profile = await ExpertProfile.findOne({ userId: expertId });
    const recentPosts = await CommunityPost.find({ author: expertId, status: 'visible' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        expert: {
          id: user._id.toString(),
          name: user.name,
          specialization: (profile as any)?.specialization || 'General',
          bio: (profile as any)?.bio || '',
          yearsExperience: (profile as any)?.yearsExperience || 0,
          avatarUrl: user.avatarUrl,
          rating: (profile as any)?.rating || 0.0,
          isOnline: true
        },
        profile: {
          expertPostsCount: (profile as any)?.expertPostsCount || 0,
          expertRepliesCount: (profile as any)?.expertRepliesCount || 0,
          joinedDate: user.createdAt.toISOString(),
          certifications: (profile as any)?.certifications || [],
          availableForConsultation: (profile as any)?.availableForConsultation ?? true,
          consultationFee: (profile as any)?.consultationFee || 0,
          responseTimeMinutes: (profile as any)?.responseTimeMinutes || 60
        },
        recentPosts: recentPosts.map(p => ({
          id: p._id.toString(),
          title: p.title,
          content: p.content,
          plantTag: p.plantTag,
          comments: p.commentsCount,
          likes: p.likes,
          timeLabel: formatRelativeTime(p.createdAt),
          imagePath: p.imagePath,
        })),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current expert's profile
// @route   PUT /api/experts/me/profile
// @access  Private (Expert only)
export const updateMyExpertProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { bio, specialization, yearsExperience } = req.body;

    // Verify role
    const user = await User.findById(userId);
    if (!user || user.role !== 'expert') {
      return next(new AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Only experts can have profiles' }));
    }

    const profile = await ExpertProfile.findOneAndUpdate(
      { userId },
      { $set: { bio, specialization, yearsExperience } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all escalations
// @route   GET /api/experts/admin/escalations
// @access  Private (Admin/Expert)
export const getEscalations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const ExpertEscalation = (await import("../models/expert_escalation_model")).default;
    const escalations = await ExpertEscalation.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { escalations }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim an escalation
// @route   POST /api/experts/admin/escalations/:id/claim
// @access  Private (Admin/Expert)
export const claimEscalation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user.id;
    const escalationId = req.params.id;

    const ExpertEscalation = (await import("../models/expert_escalation_model")).default;
    const escalation = await ExpertEscalation.findById(escalationId);

    if (!escalation) {
      return next(new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Escalation not found' }));
    }

    if (escalation.status !== "pending") {
      return next(new AppError({ code: 'INVALID_STATE', statusCode: 400, message: 'Escalation is already claimed or resolved' }));
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
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve an escalation
// @route   POST /api/experts/admin/escalations/:id/resolve
// @access  Private (Admin/Expert)
export const resolveEscalation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user.id;
    const escalationId = req.params.id;
    const { response } = req.body;

    if (!response) {
      return next(new AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Response is required' }));
    }

    const ExpertEscalation = (await import("../models/expert_escalation_model")).default;
    const escalation = await ExpertEscalation.findById(escalationId);

    if (!escalation) {
      return next(new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Escalation not found' }));
    }

    if (escalation.status !== "claimed" || escalation.assignedAdminId !== adminId) {
      return next(new AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'You must claim this escalation before resolving it' }));
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
  } catch (error) {
    next(error);
  }
};

// --- SSE Implementation for Real-Time Updates ---
let sseClients: Response[] = [];

export const streamEscalations = (req: Request, res: Response) => {
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

const broadcastEscalationEvent = (type: string, data: any) => {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (e) {
      console.warn("Error sending SSE to client", e);
    }
  });
};
