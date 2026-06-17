"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiReportRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const ai_report_model_1 = __importDefault(require("../models/ai_report_model"));
class AiReportRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(ai_report_model_1.default);
    }
    async findByUserId(userId) {
        return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }
}
exports.AiReportRepository = AiReportRepository;
