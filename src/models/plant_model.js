"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantStatus = exports.PlantStage = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
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
var PlantStatus;
(function (PlantStatus) {
    PlantStatus["DRAFT"] = "DRAFT";
    PlantStatus["PUBLISHED"] = "PUBLISHED";
    PlantStatus["ARCHIVED"] = "ARCHIVED";
})(PlantStatus || (exports.PlantStatus = PlantStatus = {}));
var plantSchema = new mongoose_1.default.Schema({
    isLibraryItem: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(PlantStatus), default: PlantStatus.DRAFT },
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
    tags: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'PlantTag' }],
    diseases: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Disease' }],
    seasons: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'SeasonalRule' }],
    slug: { type: String, index: true },
    normalizedNameEn: { type: String, index: true },
    normalizedNameAr: { type: String, index: true },
    active: { type: Boolean, default: true },
    createdBy: { type: String },
    updatedBy: { type: String },
    embedding: { type: [Number], index: '2dsphere' },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});
// Exclude soft-deleted records from basic queries
plantSchema.pre(/^find/, function (next) {
    var query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('Plant', plantSchema);
