"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantRepository = void 0;
const plant_model_1 = __importDefault(require("../models/plant_model"));
const BaseRepository_1 = require("./BaseRepository");
class PlantRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(plant_model_1.default);
    }
    async findByZoneId(zoneId, userId) {
        return this.model.find({ zone: zoneId }).where('user').equals(userId).exec();
    }
    async findByUserId(userId) {
        return this.model.find().where('user').equals(userId).exec();
    }
    async findAllWithDna() {
        return this.model.find().populate('dna').exec();
    }
}
exports.PlantRepository = PlantRepository;
