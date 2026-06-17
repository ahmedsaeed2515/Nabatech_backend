"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareService = void 0;
const CareActionRepository_1 = require("../repositories/CareActionRepository");
const FertilizerLogRepository_1 = require("../repositories/FertilizerLogRepository");
const care_queue_1 = require("../queues/care_queue");
const mongoose_1 = __importDefault(require("mongoose"));
class CareService {
    constructor() {
        this.careRepo = new CareActionRepository_1.CareActionRepository();
        this.fertRepo = new FertilizerLogRepository_1.FertilizerLogRepository();
    }
    async logAction(plantId, userId, type, date, notes) {
        const action = await this.careRepo.create({
            user: new mongoose_1.default.Types.ObjectId(userId),
            plant: new mongoose_1.default.Types.ObjectId(plantId),
            type,
            date,
            notes
        });
        await care_queue_1.careSyncQueue?.add('care.sync.action', { plantId, userId });
        return action;
    }
    async logFertilizer(plantId, userId, type, amount, date) {
        const fertLog = await this.fertRepo.create({
            user: new mongoose_1.default.Types.ObjectId(userId),
            plant: new mongoose_1.default.Types.ObjectId(plantId),
            type,
            amount,
            date
        });
        await care_queue_1.careSyncQueue?.add('care.sync.fertilizer', { plantId, userId });
        return fertLog;
    }
}
exports.CareService = CareService;
