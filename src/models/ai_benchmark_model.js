"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var aiBenchmarkSchema = new mongoose_1.Schema({
    model: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiModel", required: true },
    testSuite: { type: String, required: true },
    averageLatencyMs: { type: Number, required: true },
    successRate: { type: Number, required: true, min: 0, max: 1 },
    tokensPerSecond: { type: Number, required: true },
    testedAt: { type: Date, default: Date.now },
}, { timestamps: true });
aiBenchmarkSchema.index({ model: 1, testedAt: -1 });
exports.default = (0, mongoose_1.model)("AiBenchmark", aiBenchmarkSchema);
