import { Request, Response, NextFunction } from 'express';
import ExpertProfile from '../models/expert_profile_model';
import User from '../models/user_model';
import CommunityPost from '../models/community_post_model';
import { AppError } from '../utils/app_error';

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
