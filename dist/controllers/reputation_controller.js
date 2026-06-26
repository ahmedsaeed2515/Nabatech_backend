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
exports.awardReputationPoints = exports.getLeaderboard = exports.getUserReputation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_reputation_model_1 = __importStar(require("../models/user_reputation_model"));
// Utility to initialize reputation if it doesn't exist
const getOrCreateReputation = async (userId) => {
    let rep = await user_reputation_model_1.default.findOne({ userId });
    if (!rep) {
        rep = new user_reputation_model_1.default({ userId: new mongoose_1.default.Types.ObjectId(userId) });
        await rep.save();
    }
    return rep;
};
const getUserReputation = async (req, res) => {
    try {
        const userId = req.params.userId;
        const rep = await getOrCreateReputation(userId);
        // Also get ranking
        const rank = await user_reputation_model_1.default.countDocuments({ points: { $gt: rep.points } }) + 1;
        res.status(200).json({
            success: true,
            data: {
                reputation: rep,
                rank
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reputation', error: error.message });
    }
};
exports.getUserReputation = getUserReputation;
const getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const leaderboard = await user_reputation_model_1.default.find()
            .populate('userId', 'name avatarUrl role')
            .sort({ points: -1 })
            .limit(limit);
        res.status(200).json({
            success: true,
            data: leaderboard
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard', error: error.message });
    }
};
exports.getLeaderboard = getLeaderboard;
const NotificationService_1 = require("../services/NotificationService");
// Internal service method for awarding points (to be used by other controllers like community_controller when post is created/liked)
const awardReputationPoints = async (userId, pointsToAdd, reason) => {
    try {
        const rep = await getOrCreateReputation(userId);
        rep.points += pointsToAdd;
        let newLevel = false;
        let oldLevel = rep.level;
        // Check for level ups
        if (rep.points >= 1000 && rep.level === user_reputation_model_1.ExpertLevel.EXPERT) {
            rep.level = user_reputation_model_1.ExpertLevel.MASTER;
            newLevel = true;
        }
        else if (rep.points >= 500 && rep.level === user_reputation_model_1.ExpertLevel.REGULAR) {
            rep.level = user_reputation_model_1.ExpertLevel.EXPERT;
            newLevel = true;
        }
        else if (rep.points >= 100 && rep.level === user_reputation_model_1.ExpertLevel.NOVICE) {
            rep.level = user_reputation_model_1.ExpertLevel.REGULAR;
            newLevel = true;
        }
        if (newLevel) {
            NotificationService_1.NotificationService.sendNotification({
                userId: userId.toString(),
                actorId: userId.toString(), // Self generated
                type: 'EXPERT_LEVEL_UP',
                entityId: rep._id.toString(),
                entityType: 'User',
                title: 'Level Up!',
                message: `Congratulations! You've reached ${rep.level} level.`
            }).catch(e => console.error('Notification error', e));
        }
        const checkBadge = (threshold, badgeName, condition = true) => {
            if (condition && !rep.badges.includes(badgeName)) {
                rep.badges.push(badgeName);
                NotificationService_1.NotificationService.sendNotification({
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
    }
    catch (error) {
        console.error('Failed to award reputation points:', error);
    }
};
exports.awardReputationPoints = awardReputationPoints;
