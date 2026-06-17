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
const aiModelManifestItemSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    architecture: { type: String, required: true, trim: true },
    classes: { type: Number, required: true, min: 1 },
    sizeMb: { type: Number, required: true, min: 0 },
    inputSize: { type: Number, required: true, default: 224 },
    normalization: { type: String, required: true, default: "zero_to_one", trim: true },
    quantization: { type: String, required: true, trim: true },
    modelUrl: { type: String, required: true, trim: true },
    labelsUrl: { type: String, required: true, trim: true },
    sha256: { type: String, required: true, trim: true },
    recommended: { type: Boolean, default: false },
    manifestVersion: { type: String, default: "1.0", trim: true },
    platform: { type: String, default: "all", trim: true },
    minAppVersion: { type: String, default: "0.0.0", trim: true },
    active: { type: Boolean, default: true },
    rollbackOf: { type: String, trim: true },
    publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });
aiModelManifestItemSchema.index({ recommended: 1, platform: 1, active: 1 }, { unique: true, partialFilterExpression: { recommended: true, active: true } });
exports.default = mongoose_1.default.model("AiModelManifestItem", aiModelManifestItemSchema);
