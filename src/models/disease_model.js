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
var mongoose_1 = __importStar(require("mongoose"));
var diseaseSchema = new mongoose_1.Schema({
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    type: { type: String, enum: ["Fungal", "Bacterial", "Viral", "Pest"], default: "Fungal" },
    affectedPlantsCount: { type: Number, default: 0 },
    descriptionAr: { type: String, default: "" },
    descriptionEn: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    normalizedNameEn: { type: String, required: true, index: true },
    normalizedNameAr: { type: String, required: true, index: true },
    active: { type: Boolean, default: true },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
// Compound indexes for efficient search
diseaseSchema.index({ type: 1, normalizedNameEn: 1 });
exports.default = mongoose_1.default.model("Disease", diseaseSchema);
