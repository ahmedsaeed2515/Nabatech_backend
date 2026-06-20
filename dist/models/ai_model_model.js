"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiModelSchema = new mongoose_1.Schema({
    provider: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiProvider", required: true },
    modelId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    type: { type: String, enum: ["chat", "vision", "embedding", "diagnosis"], required: true },
    contextWindow: { type: Number, default: 8192 },
    inputCostPer1k: { type: Number, default: 0 },
    outputCostPer1k: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiModel", aiModelSchema);
