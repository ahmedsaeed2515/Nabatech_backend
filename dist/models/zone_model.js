"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var ZoneType;
(function (ZoneType) {
    ZoneType["FULL_SUN"] = "FULL_SUN";
    ZoneType["PARTIAL_SHADE"] = "PARTIAL_SHADE";
    ZoneType["FULL_SHADE"] = "FULL_SHADE";
    ZoneType["INDOOR_WINDOW"] = "INDOOR_WINDOW";
    ZoneType["GROW_TENT"] = "GROW_TENT";
})(ZoneType || (exports.ZoneType = ZoneType = {}));
const zoneSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    garden: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Garden', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(ZoneType), default: ZoneType.PARTIAL_SHADE },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});
// Exclude soft-deleted records from basic queries
zoneSchema.pre(/^find/, function (next) {
    const query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('Zone', zoneSchema);
