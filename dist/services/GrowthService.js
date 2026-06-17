"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthService = void 0;
const GrowthMeasurementRepository_1 = require("../repositories/GrowthMeasurementRepository");
const PlantStageHistoryRepository_1 = require("../repositories/PlantStageHistoryRepository");
const PlantRepository_1 = require("../repositories/PlantRepository");
const mongoose_1 = __importDefault(require("mongoose"));
class GrowthService {
    constructor() {
        this.growthRepo = new GrowthMeasurementRepository_1.GrowthMeasurementRepository();
        this.stageHistoryRepo = new PlantStageHistoryRepository_1.PlantStageHistoryRepository();
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    async logMeasurement(plantId, userId, data) {
        const plant = await this.plantRepo.findOne({ _id: plantId, user: userId });
        if (!plant)
            throw new Error('Plant not found');
        const measurement = await this.growthRepo.create({
            user: new mongoose_1.default.Types.ObjectId(userId),
            plant: new mongoose_1.default.Types.ObjectId(plantId),
            heightCm: data.heightCm,
            leafCount: data.leafCount,
            stage: data.stage,
            photoUrl: data.photoUrl
        });
        if (data.stage && data.stage !== plant.stage) {
            // Stage has changed, create history and update plant
            await this.stageHistoryRepo.create({
                user: new mongoose_1.default.Types.ObjectId(userId),
                plant: new mongoose_1.default.Types.ObjectId(plantId),
                stage: data.stage,
                enteredAt: new Date()
            });
            plant.stage = data.stage;
            await plant.save();
        }
        return measurement;
    }
    async getTimeline(plantId, userId) {
        const measurements = await this.growthRepo.findByPlantId(plantId, userId);
        const stageHistory = await this.stageHistoryRepo.findByPlantId(plantId, userId);
        return {
            measurements,
            stageHistory
        };
    }
}
exports.GrowthService = GrowthService;
