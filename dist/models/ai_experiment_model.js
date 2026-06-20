"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiExperimentSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    controlModel: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiModel", required: true },
    variantModel: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiModel", required: true },
    status: { type: String, enum: ["running", "completed", "stopped"], default: "running" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    metrics: {
        controlSuccess: { type: Number, default: 0 },
        variantSuccess: { type: Number, default: 0 },
        controlFailures: { type: Number, default: 0 },
        variantFailures: { type: Number, default: 0 },
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiExperiment", aiExperimentSchema);
