"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var aiMemoryPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    maxContextTokens: { type: Number, default: 4096 },
    shortTermTtlDays: { type: Number, default: 7 },
    extractLongTermFacts: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiMemoryPolicy", aiMemoryPolicySchema);
