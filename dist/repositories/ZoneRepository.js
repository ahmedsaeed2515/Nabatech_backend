"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneRepository = void 0;
const zone_model_1 = __importDefault(require("../models/zone_model"));
const BaseRepository_1 = require("./BaseRepository");
class ZoneRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(zone_model_1.default);
    }
    async findByGardenId(gardenId, userId) {
        return this.model.find({ garden: gardenId }).where('user').equals(userId).exec();
    }
    async findOutdoorZonesWithUsers() {
        return this.model.find({ type: 'OUTDOOR' }).populate('user').exec();
    }
}
exports.ZoneRepository = ZoneRepository;
