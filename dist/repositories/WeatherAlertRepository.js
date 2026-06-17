"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherAlertRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const weather_alert_model_1 = __importDefault(require("../models/weather_alert_model"));
class WeatherAlertRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(weather_alert_model_1.default);
    }
    async findByUserId(userId) {
        return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }
    async checkRecentAlert(userId, zoneId, severity, since) {
        const alerts = await this.model.find({
            user: userId,
            zone: zoneId,
            severity,
            createdAt: { $gte: since }
        }).exec();
        return alerts.length > 0;
    }
}
exports.WeatherAlertRepository = WeatherAlertRepository;
