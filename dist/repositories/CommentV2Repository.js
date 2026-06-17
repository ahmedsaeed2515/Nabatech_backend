"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentV2Repository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const comment_v2_model_1 = __importDefault(require("../models/comment_v2_model"));
class CommentV2Repository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(comment_v2_model_1.default);
    }
    async findByPostId(postId) {
        return this.model.find({ post: postId })
            .sort({ createdAt: 1 })
            .populate('user', 'email level')
            .exec();
    }
}
exports.CommentV2Repository = CommentV2Repository;
