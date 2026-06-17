"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const post_model_1 = __importDefault(require("../models/post_model"));
class PostRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(post_model_1.default);
    }
    async findPaginated(skip, limit) {
        return this.model.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'email level')
            .exec();
    }
    async countAll() {
        return this.model.countDocuments().exec();
    }
    async incrementLikes(postId) {
        await this.model.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }).exec();
    }
    async decrementLikes(postId) {
        await this.model.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }).exec();
    }
}
exports.PostRepository = PostRepository;
