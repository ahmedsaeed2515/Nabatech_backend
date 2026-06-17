"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnaRepository = void 0;
const plant_dna_model_1 = __importDefault(require("../models/plant_dna_model"));
const BaseRepository_1 = require("./BaseRepository");
class DnaRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(plant_dna_model_1.default);
    }
    async findBySpecies(species) {
        return this.model.findOne({ species }).exec();
    }
}
exports.DnaRepository = DnaRepository;
