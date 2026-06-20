"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
class PostRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(community_post_model_1.default);
    }
    async findPaginated(skip, limit) {
        return this.model.find({ status: 'visible' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'name email level')
            .exec();
    }
    async countAll() {
        return this.model.countDocuments({ status: 'visible' }).exec();
    }
    async incrementLikes(postId) {
        await this.model.findByIdAndUpdate(postId, { $inc: { likes: 1 } }).exec();
    }
    async decrementLikes(postId) {
        await this.model.findByIdAndUpdate(postId, { $inc: { likes: -1 } }).exec();
    }
}
exports.PostRepository = PostRepository;
