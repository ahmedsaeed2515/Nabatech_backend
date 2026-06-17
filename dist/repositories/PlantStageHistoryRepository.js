"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantStageHistoryRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const plant_stage_history_model_1 = __importDefault(require("../models/plant_stage_history_model"));
class PlantStageHistoryRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(plant_stage_history_model_1.default);
    }
    async findByPlantId(plantId, userId) {
        return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ enteredAt: -1 }).exec();
    }
}
exports.PlantStageHistoryRepository = PlantStageHistoryRepository;
