"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantIdentificationRepository = void 0;
const plant_identification_history_model_1 = __importDefault(require("../models/plant_identification_history_model"));
const BaseRepository_1 = require("./BaseRepository");
const mongoose_1 = __importDefault(require("mongoose"));
class PlantIdentificationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(plant_identification_history_model_1.default);
    }
    async findByUserId(userId) {
        return this.model.find({ user: new mongoose_1.default.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    }
    async markAsAddedToGarden(id) {
        return this.model.findByIdAndUpdate(id, { isAddedToGarden: true }, { new: true });
    }
}
exports.PlantIdentificationRepository = PlantIdentificationRepository;
