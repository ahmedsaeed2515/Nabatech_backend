"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthEngineService = void 0;
const PlantHealthLogRepository_1 = require("../repositories/PlantHealthLogRepository");
const CareActionRepository_1 = require("../repositories/CareActionRepository");
const FertilizerLogRepository_1 = require("../repositories/FertilizerLogRepository");
const PlantRepository_1 = require("../repositories/PlantRepository");
const care_action_model_1 = require("../models/care_action_model");
const mongoose_1 = __importDefault(require("mongoose"));
class HealthEngineService {
    constructor() {
        this.healthRepo = new PlantHealthLogRepository_1.PlantHealthLogRepository();
        this.careRepo = new CareActionRepository_1.CareActionRepository();
        this.fertRepo = new FertilizerLogRepository_1.FertilizerLogRepository();
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    async calculate(plantId, userId) {
        const plant = await this.plantRepo.findOne({ _id: plantId, user: userId });
        if (!plant)
            throw new Error('Plant not found');
        let score = 100;
        const issues = [];
        // Check overdue watering
        const careActions = await this.careRepo.findByPlantId(plantId, userId);
        const lastWatering = careActions.find(a => a.type === care_action_model_1.CareActionType.WATER);
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        if (!lastWatering || !lastWatering.date || (now - new Date(lastWatering.date).getTime() > SEVEN_DAYS_MS)) {
            score -= 10;
            issues.push('Overdue watering');
        }
        // Check recent fertilizer
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const fertLogs = await this.fertRepo.findByPlantId(plantId, userId);
        const recentFert = fertLogs.find(f => f.date && (now - new Date(f.date).getTime() <= THIRTY_DAYS_MS));
        if (recentFert) {
            score = Math.min(100, score + 5);
        }
        // Save PlantHealthLog
        await this.healthRepo.create({
            user: new mongoose_1.default.Types.ObjectId(userId),
            plant: new mongoose_1.default.Types.ObjectId(plantId),
            score,
            issues
        });
        // Update Plant
        plant.healthScore = score;
        await plant.save();
        return score;
    }
}
exports.HealthEngineService = HealthEngineService;
