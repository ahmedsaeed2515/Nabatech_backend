"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
const UserXpRepository_1 = require("../repositories/UserXpRepository");
const StreakRepository_1 = require("../repositories/StreakRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const care_action_model_1 = require("../models/care_action_model");
const user_model_1 = require("../models/user_model");
const logger_1 = require("../utils/logger");
class GamificationService {
    constructor() {
        this.userXpRepo = new UserXpRepository_1.UserXpRepository();
        this.streakRepo = new StreakRepository_1.StreakRepository();
        this.userRepo = new UserRepository_1.UserRepository();
    }
    async awardXp(userId, actionType) {
        try {
            // 1. Calculate XP based on action
            let xpAwarded = 0;
            switch (actionType) {
                case care_action_model_1.CareActionType.WATER:
                    xpAwarded = 5;
                    break;
                case care_action_model_1.CareActionType.PRUNE:
                    xpAwarded = 10;
                    break;
                case care_action_model_1.CareActionType.REPOTTING:
                    xpAwarded = 20;
                    break;
                case 'FERTILIZER':
                    xpAwarded = 15;
                    break;
                default:
                    xpAwarded = 2;
                    break;
            }
            // 2. Update UserXP
            let userXp = await this.userXpRepo.findByUserId(userId);
            if (!userXp) {
                userXp = await this.userXpRepo.create({ user: userId, totalXp: xpAwarded });
            }
            else {
                userXp.totalXp += xpAwarded;
                await userXp.save();
            }
            // 3. Evaluate Level Logic
            let newLevel = user_model_1.UserLevel.SPROUT;
            if (userXp.totalXp >= 500) {
                newLevel = user_model_1.UserLevel.BOTANIST;
            }
            else if (userXp.totalXp >= 100) {
                newLevel = user_model_1.UserLevel.GARDENER;
            }
            const user = await this.userRepo.findById(userId);
            if (user && user.level !== newLevel) {
                user.level = newLevel;
                await user.save();
                logger_1.logger.info(`User ${userId} leveled up to ${newLevel}!`);
            }
            // 4. Update Streak Logic
            let streak = await this.streakRepo.findByUserId(userId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!streak) {
                streak = await this.streakRepo.create({ user: userId, current: 1, longest: 1, lastActive: new Date() });
            }
            else {
                const lastActiveDay = new Date(streak.lastActive);
                lastActiveDay.setHours(0, 0, 0, 0);
                const diffTime = Math.abs(today.getTime() - lastActiveDay.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    // It was yesterday, increment streak
                    streak.current += 1;
                    streak.lastActive = new Date();
                    if (streak.current > streak.longest) {
                        streak.longest = streak.current;
                    }
                    await streak.save();
                }
                else if (diffDays > 1) {
                    // More than 1 day ago, streak broken, start over
                    streak.current = 1;
                    streak.lastActive = new Date();
                    await streak.save();
                }
                else {
                    // Today, do nothing to streak count, just update lastActive maybe
                    streak.lastActive = new Date();
                    await streak.save();
                }
            }
        }
        catch (err) {
            logger_1.logger.error(`Error awarding XP for user ${userId}:`, err);
        }
    }
}
exports.GamificationService = GamificationService;
