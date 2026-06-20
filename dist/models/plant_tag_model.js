"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const plantTagSchema = new mongoose_1.default.Schema({
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    colorHex: { type: String, default: '#4CAF50' },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});
plantTagSchema.pre(/^find/, function (next) {
    const query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('PlantTag', plantTagSchema);
