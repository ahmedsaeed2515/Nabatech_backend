"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const plantDnaSchema = new mongoose_1.default.Schema({
    species: { type: String, required: true, unique: true },
    scientificName: { type: String, required: true },
    toxicity: { type: Boolean, default: false },
    minTemp: { type: Number, required: true },
    maxTemp: { type: Number, required: true },
    lightReq: { type: String, required: true },
    waterFrequencyDays: { type: Number, required: true, default: 7 },
    deletedAt: { type: Date, default: null },
    soilType: { type: String },
    humidity: { type: String },
    description: { type: String },
    source: { type: String, default: 'MANUAL' },
    verified: { type: Boolean, default: true },
    generatedAt: { type: Date }
}, {
    timestamps: true
});
// Exclude soft-deleted records from basic queries
plantDnaSchema.pre(/^find/, function (next) {
    const query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('PlantDna', plantDnaSchema);
