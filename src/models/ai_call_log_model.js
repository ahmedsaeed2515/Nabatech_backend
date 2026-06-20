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
var aiCallLogSchema = new mongoose_1.Schema({
    userId: { type: String, default: "" },
    requestId: { type: String, trim: true },
    feature: { type: String, enum: ["diagnosis", "chat", "image_chat"], required: true },
    provider: { type: String, required: true, trim: true },
    modelId: { type: String, trim: true },
    sourceIds: { type: [String], default: [] },
    status: { type: String, enum: ["success", "failure"], required: true },
    latencyMs: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    routedFrom: { type: [String], default: [] },
    inputMeta: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    outputMeta: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    errorMessage: { type: String, default: "" },
    toolCalls: [
        {
            toolName: { type: String, required: true },
            argsSummary: { type: String, required: true },
            status: { type: String, enum: ["success", "failure"], required: true },
            errorMessage: { type: String },
            durationMs: { type: Number, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });
// TTL index for logs retention (e.g., 30 days)
aiCallLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
exports.default = mongoose_1.default.model("AiCallLog", aiCallLogSchema);
