"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserXpRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const user_xp_model_1 = __importDefault(require("../models/user_xp_model"));
class UserXpRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(user_xp_model_1.default);
    }
    async findByUserId(userId) {
        return this.model.findOne({ user: userId }).exec();
    }
}
exports.UserXpRepository = UserXpRepository;
