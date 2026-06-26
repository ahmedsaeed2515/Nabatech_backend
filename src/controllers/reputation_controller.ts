import { Request, Response } from 'express';
import mongoose from 'mongoose';
import UserReputation, { ExpertLevel } from '../models/user_reputation_model';
import User from '../models/user_model';

// Utility to initialize reputation if it doesn't exist
const getOrCreateReputation = async (userId: mongoose.Types.ObjectId | string) => {
  let rep = await UserReputation.findOne({ userId });
  if (!rep) {
    rep = new UserReputation({ userId: new mongoose.Types.ObjectId(userId) });
    await rep.save();
  }
  return rep;
};

export const getUserReputation = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const rep = await getOrCreateReputation(userId as string);
    
    // Also get ranking
    const rank = await UserReputation.countDocuments({ points: { $gt: rep.points } }) + 1;

    res.status(200).json({
      success: true,
      data: {
        reputation: rep,
        rank
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch reputation', error: error.message });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const leaderboard = await UserReputation.find()
      .populate('userId', 'name avatarUrl role')
      .sort({ points: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard', error: error.message });
  }
};

import { NotificationService } from '../services/NotificationService';

// Internal service method for awarding points (to be used by other controllers like community_controller when post is created/liked)
export const awardReputationPoints = async (userId: string | mongoose.Types.ObjectId, pointsToAdd: number, reason: string) => {
  try {
    const rep = await getOrCreateReputation(userId);
    rep.points += pointsToAdd;

    let newLevel = false;
    let oldLevel = rep.level;
    // Check for level ups
    if (rep.points >= 1000 && rep.level === ExpertLevel.EXPERT) {
      rep.level = ExpertLevel.MASTER;
      newLevel = true;
    } else if (rep.points >= 500 && rep.level === ExpertLevel.REGULAR) {
      rep.level = ExpertLevel.EXPERT;
      newLevel = true;
    } else if (rep.points >= 100 && rep.level === ExpertLevel.NOVICE) {
      rep.level = ExpertLevel.REGULAR;
      newLevel = true;
    }

    if (newLevel) {
      NotificationService.sendNotification({
        userId: userId.toString(),
        actorId: userId.toString(), // Self generated
        type: 'EXPERT_LEVEL_UP',
        entityId: rep._id.toString(),
        entityType: 'User',
        title: 'Level Up!',
        message: `Congratulations! You've reached ${rep.level} level.`
      }).catch(e => console.error('Notification error', e));
    }

    const checkBadge = (threshold: number, badgeName: string, condition: boolean = true) => {
      if (condition && !rep.badges.includes(badgeName)) {
        rep.badges.push(badgeName);
        NotificationService.sendNotification({
          userId: userId.toString(),
          actorId: userId.toString(),
          type: 'BADGE_EARNED',
          entityId: rep._id.toString(),
          entityType: 'User',
          title: 'New Badge Earned!',
          message: `You earned the "${badgeName}" badge.`
        }).catch(e => console.error('Notification error', e));
      }
    };

    // Check for badges
    checkBadge(100, 'Contributor', rep.points >= 100);
    checkBadge(500, 'Top Voice', rep.points >= 500);
    checkBadge(50, 'Helpful Solution', pointsToAdd >= 50);

    await rep.save();
    return rep;
  } catch (error) {
    console.error('Failed to award reputation points:', error);
  }
};


