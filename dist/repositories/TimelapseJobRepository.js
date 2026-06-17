"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelapseJobRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const timelapse_job_model_1 = __importDefault(require("../models/timelapse_job_model"));
class TimelapseJobRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(timelapse_job_model_1.default);
    }
    async findByUser(userId) {
        return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }
    async findByPlant(plantId) {
        return this.model.find({ plant: plantId }).sort({ createdAt: -1 }).exec();
    }
}
exports.TimelapseJobRepository = TimelapseJobRepository;
