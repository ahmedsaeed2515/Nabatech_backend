"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsSnapshotRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const analytics_snapshot_model_1 = __importDefault(require("../models/analytics_snapshot_model"));
class AnalyticsSnapshotRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(analytics_snapshot_model_1.default);
    }
    async findByUserId(userId) {
        return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }
}
exports.AnalyticsSnapshotRepository = AnalyticsSnapshotRepository;
