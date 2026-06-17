"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenService = void 0;
const GardenRepository_1 = require("../repositories/GardenRepository");
const ZoneRepository_1 = require("../repositories/ZoneRepository");
const PlantRepository_1 = require("../repositories/PlantRepository");
const mongoose_1 = __importDefault(require("mongoose"));
class GardenService {
    constructor() {
        this.gardenRepo = new GardenRepository_1.GardenRepository();
        this.zoneRepo = new ZoneRepository_1.ZoneRepository();
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    async createGarden(userId, name, type) {
        return this.gardenRepo.create({ user: new mongoose_1.default.Types.ObjectId(userId), name, type });
    }
    async getGardensByUser(userId) {
        return this.gardenRepo.findByUserId(userId);
    }
    async createZone(gardenId, name, type) {
        return this.zoneRepo.create({ garden: new mongoose_1.default.Types.ObjectId(gardenId), name, type });
    }
    async getZonesByGarden(gardenId, userId) {
        return this.zoneRepo.findByGardenId(gardenId, userId);
    }
}
exports.GardenService = GardenService;
