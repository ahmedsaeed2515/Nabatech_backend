"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantService = void 0;
const PlantRepository_1 = require("../repositories/PlantRepository");
const plant_model_1 = require("../models/plant_model");
const mongoose_1 = __importDefault(require("mongoose"));
class PlantService {
    constructor() {
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    async createPlant(userId, zoneId, dnaId, name, imageUrl) {
        const dna = await mongoose_1.default.model('PlantDna').findById(dnaId);
        const plantData = {
            user: new mongoose_1.default.Types.ObjectId(userId),
            zone: new mongoose_1.default.Types.ObjectId(zoneId),
            dna: new mongoose_1.default.Types.ObjectId(dnaId),
            name,
            scientificName: dna?.scientificName,
            imageUrl: imageUrl || '',
            lightRequirements: dna?.lightReq,
            wateringFrequency: dna?.waterFrequencyDays ? `Every ${dna.waterFrequencyDays} days` : undefined,
            stage: plant_model_1.PlantStage.SEED,
            healthScore: 100
        };
        console.log("\n[DEBUG_RUNTIME] Plant object before save:", JSON.stringify(plantData, null, 2));
        const createdPlant = await this.plantRepo.create(plantData);
        console.log("\n[DEBUG_RUNTIME] Mongo document after save:", JSON.stringify(createdPlant.toObject(), null, 2));
        return createdPlant;
    }
    async getPlantDetails(plantId, userId) {
        return this.plantRepo.findOne({ _id: plantId, user: userId });
    }
    async getPlantsByUser(userId) {
        return this.plantRepo.findByUserId(userId);
    }
    async getPlantsByZone(zoneId, userId) {
        return this.plantRepo.findByZoneId(zoneId, userId);
    }
    async searchPlants(query, options) {
        return this.plantRepo.searchPlants(query, options.limit);
    }
    async deletePlant(plantId, userId) {
        const plant = await this.plantRepo.findOne({ _id: plantId, user: userId });
        if (!plant)
            return false;
        await this.plantRepo.hardDelete(plantId);
        return true;
    }
}
exports.PlantService = PlantService;
