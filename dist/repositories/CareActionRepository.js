"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareActionRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const care_action_model_1 = __importDefault(require("../models/care_action_model"));
class CareActionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(care_action_model_1.default);
    }
    async findByPlantId(plantId, userId) {
        return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ date: -1 }).exec();
    }
    async findRecentWatering(plantId) {
        return this.model.findOne({ plant: plantId, type: 'WATER' }).sort({ date: -1 }).exec();
    }
    async aggregateCareActions(pipeline) {
        return this.model.aggregate(pipeline).exec();
    }
}
exports.CareActionRepository = CareActionRepository;
