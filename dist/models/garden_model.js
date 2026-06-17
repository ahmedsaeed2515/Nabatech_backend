"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var GardenType;
(function (GardenType) {
    GardenType["INDOOR"] = "INDOOR";
    GardenType["OUTDOOR"] = "OUTDOOR";
    GardenType["GREENHOUSE"] = "GREENHOUSE";
    GardenType["BALCONY"] = "BALCONY";
})(GardenType || (exports.GardenType = GardenType = {}));
const gardenSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(GardenType), default: GardenType.INDOOR },
    score: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});
// Exclude soft-deleted records from basic queries
gardenSchema.pre(/^find/, function (next) {
    const query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('Garden', gardenSchema);
