"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiRoutingRuleSchema = new mongoose_1.Schema({
    useCase: { type: String, required: true, unique: true, index: true },
    primaryModel: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiModel", required: true },
    fallbackModels: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "AiModel" }],
    abTestActive: { type: Boolean, default: false },
    abTestModel: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiModel" },
    abTestSplit: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiRoutingRule", aiRoutingRuleSchema);
