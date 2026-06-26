"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const myPlantSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    garden: { type: mongoose_1.Schema.Types.ObjectId, ref: "Garden", index: true },
    zone: { type: mongoose_1.Schema.Types.ObjectId, ref: "Zone", index: true },
    name: { type: String, required: true },
    species: { type: String, required: true },
    scientificName: { type: String },
    imageUrl: { type: String, default: "" },
    location: { type: String, enum: ['indoor', 'outdoor', 'داخلي', 'خارجي'], lowercase: true, required: true },
    room: { type: String },
    notes: { type: String },
    waterFrequencyDays: { type: Number, required: true },
    lastWatered: { type: Date, default: Date.now },
    lastFertilized: { type: Date },
    plantLibraryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "PlantLibrary" },
    confidenceScore: { type: Number },
    aiVerified: { type: Boolean, default: false },
    userApproved: { type: Boolean, default: false },
    enableNotifications: { type: Boolean, default: true },
    healthStatus: {
        type: String,
        enum: ['excellent', 'good', 'needs_care', 'sick', 'critical', 'ممتازة', 'جيدة', 'تحتاج رعاية', 'مريضة', 'حرجة'],
        lowercase: true,
        default: 'excellent'
    },
    growthStage: {
        type: String,
        enum: ['SEED', 'SPROUT', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURE', 'DEAD'],
        uppercase: true,
        default: 'MATURE'
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("MyPlant", myPlantSchema);
