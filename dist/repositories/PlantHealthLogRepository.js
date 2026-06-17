"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantHealthLogRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const plant_health_log_model_1 = __importDefault(require("../models/plant_health_log_model"));
class PlantHealthLogRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(plant_health_log_model_1.default);
    }
}
exports.PlantHealthLogRepository = PlantHealthLogRepository;
