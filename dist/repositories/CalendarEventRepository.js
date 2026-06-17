"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const calendar_event_model_1 = __importDefault(require("../models/calendar_event_model"));
class CalendarEventRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(calendar_event_model_1.default);
    }
    async findByDate(userId, dateStart, dateEnd) {
        return this.model.findOne({
            date: { $gte: dateStart, $lt: dateEnd }
        }).where('user').equals(userId).populate('tasks').exec();
    }
}
exports.CalendarEventRepository = CalendarEventRepository;
