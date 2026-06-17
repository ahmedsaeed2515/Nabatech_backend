"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistItemRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const wishlist_item_model_1 = __importDefault(require("../models/wishlist_item_model"));
class WishlistItemRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(wishlist_item_model_1.default);
    }
    async findByUser(userId) {
        return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }
    async findByUserAndId(userId, id) {
        return this.model.findOne({ _id: id, user: userId }).exec();
    }
}
exports.WishlistItemRepository = WishlistItemRepository;
