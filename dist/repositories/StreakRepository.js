"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const streak_model_1 = __importDefault(require("../models/streak_model"));
class StreakRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(streak_model_1.default);
    }
    async findByUserId(userId) {
        return this.model.findOne({ user: userId }).exec();
    }
    async resetStaleStreaks(staleThreshold) {
        await this.model.updateMany({ lastActive: { $lt: staleThreshold } }, { $set: { current: 0 } }).exec();
    }
}
exports.StreakRepository = StreakRepository;
