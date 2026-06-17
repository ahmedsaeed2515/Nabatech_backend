"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthMeasurementRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const growth_measurement_model_1 = __importDefault(require("../models/growth_measurement_model"));
class GrowthMeasurementRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(growth_measurement_model_1.default);
    }
    async findByPlantId(plantId, userId) {
        return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ createdAt: -1 }).exec();
    }
}
exports.GrowthMeasurementRepository = GrowthMeasurementRepository;
