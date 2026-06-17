"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeV2Repository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const like_v2_model_1 = __importDefault(require("../models/like_v2_model"));
class LikeV2Repository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(like_v2_model_1.default);
    }
    async findByUserAndPost(userId, postId) {
        return this.model.findOne({ user: userId, post: postId }).exec();
    }
    async deleteByUserAndPost(userId, postId) {
        await this.model.deleteOne({ user: userId, post: postId }).exec();
    }
}
exports.LikeV2Repository = LikeV2Repository;
