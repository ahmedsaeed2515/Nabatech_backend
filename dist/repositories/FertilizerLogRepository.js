"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FertilizerLogRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const fertilizer_log_model_1 = __importDefault(require("../models/fertilizer_log_model"));
class FertilizerLogRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(fertilizer_log_model_1.default);
    }
    async findByPlantId(plantId, userId) {
        return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ date: -1 }).exec();
    }
}
exports.FertilizerLogRepository = FertilizerLogRepository;
