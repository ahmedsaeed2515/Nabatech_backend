"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantStage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var PlantStage;
(function (PlantStage) {
    PlantStage["SEED"] = "SEED";
    PlantStage["SPROUT"] = "SPROUT";
    PlantStage["VEGETATIVE"] = "VEGETATIVE";
    PlantStage["FLOWERING"] = "FLOWERING";
    PlantStage["FRUITING"] = "FRUITING";
    PlantStage["MATURE"] = "MATURE";
    PlantStage["DEAD"] = "DEAD";
})(PlantStage || (exports.PlantStage = PlantStage = {}));
const plantSchema = new mongoose_1.default.Schema({
    isLibraryItem: { type: Boolean, default: false },
    zone: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Zone', index: true },
    dna: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'PlantDna' },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String },
    nameAr: { type: String },
    nameEn: { type: String },
    scientificName: { type: String },
    category: { type: String },
    careLevel: { type: String },
    descriptionAr: { type: String },
    descriptionEn: { type: String },
    waterRequirements: { type: String },
    lightRequirements: { type: String },
    humidityRequirements: { type: String },
    soilRequirements: { type: String },
    fertilizerRequirements: { type: String },
    growthRate: { type: String },
    matureSize: { type: String },
    temperatureRange: { type: String },
    imageUrl: { type: String, default: '' },
    stage: { type: String, enum: Object.values(PlantStage), default: PlantStage.SEED },
    healthScore: { type: Number, default: 100 },
    lastWatered: { type: Date },
    lastFertilized: { type: Date },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});
// Exclude soft-deleted records from basic queries
plantSchema.pre(/^find/, function (next) {
    const query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('Plant', plantSchema);
