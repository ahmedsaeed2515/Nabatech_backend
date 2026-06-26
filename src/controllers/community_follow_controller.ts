import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Follow from '../models/follow_model';
import User from '../models/user_model';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/NotificationService';
import { CommunityAuditService } from '../services/community_audit_service';

export const followUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user?.userId;
    const followingId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    // Check if the user to follow exists
    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: new mongoose.Types.ObjectId(followerId as string),
      following: new mongoose.Types.ObjectId(followingId as string),
    });

    await follow.save();

    await CommunityAuditService.logAction(followerId as string, 'FOLLOW_USER', 'User', followingId as string);
    logger.info('User followed another user', {
      event: 'community_feed_and_moderation.follow_user',
      actorId: followerId,
      targetId: followingId,
    });

    // Fire notification
    NotificationService.sendNotification({
      userId: followingId as string,
      actorId: followerId as string,
      type: 'FOLLOW_USER',
      entityId: followerId as string,
      entityType: 'User',
      title: 'New Follower',
      message: `${(req as any).user?.name || 'Someone'} started following you.`
    }).catch(e => logger.error('Error sending follow notification', { error: e }));

    res.status(201).json({ success: true, message: 'Successfully followed user' });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }
    logger.error('Failed to follow user', { event: 'community_feed_and_moderation.follow_user.error', error });
    res.status(500).json({ success: false, message: 'Failed to follow user', error: error.message });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user?.userId || (req as any).user?.id;
    const followingId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await Follow.findOneAndDelete({
      follower: new mongoose.Types.ObjectId(followerId as string),
      following: new mongoose.Types.ObjectId(followingId as string),
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Follow relationship not found' });
    }

    await CommunityAuditService.logAction(followerId as string, 'UNFOLLOW_USER', 'User', followingId as string);
    logger.info('User unfollowed another user', {
      event: 'community_feed_and_moderation.unfollow_user',
      actorId: followerId,
      targetId: followingId,
    });

    res.status(200).json({ success: true, message: 'Successfully unfollowed user' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to unfollow user', error: error.message });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const followers = await Follow.find({ following: new mongoose.Types.ObjectId(userId as string) })
      .populate('follower', 'name avatarUrl role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ following: new mongoose.Types.ObjectId(userId as string) });

    res.status(200).json({
      success: true,
      data: followers.map(f => f.follower),
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get followers', error: error.message });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const following = await Follow.find({ follower: new mongoose.Types.ObjectId(userId as string) })
      .populate('following', 'name avatarUrl role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ follower: new mongoose.Types.ObjectId(userId as string) });

    res.status(200).json({
      success: true,
      data: following.map(f => f.following),
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get following', error: error.message });
  }
};


