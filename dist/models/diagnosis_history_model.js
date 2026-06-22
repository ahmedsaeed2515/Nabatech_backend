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
const diagnosisHistorySchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientOperationId: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    imageUrl: { type: String, default: "" },
    diseaseNameAr: { type: String, default: "" },
    diseaseNameEn: { type: String, required: true },
    confidence: { type: Number, required: true },
    severity: { type: String, enum: ["low", "medium", "high", "منخفضة", "متوسطة", "عالية"], default: "medium" },
    diagnosedAt: { type: Date, default: Date.now },
    isOffline: { type: Boolean, default: false },
    diagnosisSource: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    feedbackStatus: { type: String, enum: ["pending", "confirmed", "rejected"], default: "pending" },
    candidates: { type: [{ label: String, confidence: Number }], default: [] },
    plantId: { type: mongoose_1.Schema.Types.ObjectId, ref: "MyPlant", required: false },
    modelId: { type: String, default: "legacy_backend" },
    modelVersion: { type: String, default: "unknown" },
    provider: { type: String, default: "legacy" },
    source: { type: String, trim: true },
    sourceIds: { type: [String], default: [] },
    uncertain: { type: Boolean, default: false },
    needsNewImage: { type: Boolean, default: false },
    advice: { type: String, trim: true },
    llmResponse: { type: String, trim: true },
    cnnResult: { type: String, trim: true },
    ragContext: { type: [String], default: [] },
    retentionUntil: { type: Date, expires: 0 },
    version: { type: Number, default: 1 },
}, { timestamps: true });
diagnosisHistorySchema.index({ user: 1, diagnosedAt: -1, _id: -1 });
diagnosisHistorySchema.index({ diagnosedAt: -1 });
diagnosisHistorySchema.index({ feedbackStatus: 1, diagnosedAt: -1 });
diagnosisHistorySchema.index({ user: 1, clientOperationId: 1 }, { unique: true, partialFilterExpression: { clientOperationId: { $exists: true, $type: "string" } } });
exports.default = mongoose_1.default.model("DiagnosisHistory", diagnosisHistorySchema);
