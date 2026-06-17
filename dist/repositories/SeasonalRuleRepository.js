"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonalRuleRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const seasonal_rule_model_1 = __importDefault(require("../models/seasonal_rule_model"));
class SeasonalRuleRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(seasonal_rule_model_1.default);
    }
}
exports.SeasonalRuleRepository = SeasonalRuleRepository;
