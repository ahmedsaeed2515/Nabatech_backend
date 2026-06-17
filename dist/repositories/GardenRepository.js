"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenRepository = void 0;
const garden_model_1 = __importDefault(require("../models/garden_model"));
const BaseRepository_1 = require("./BaseRepository");
class GardenRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(garden_model_1.default);
    }
    async findByUserId(userId) {
        return this.model.find().where('user').equals(userId).exec();
    }
}
exports.GardenRepository = GardenRepository;
