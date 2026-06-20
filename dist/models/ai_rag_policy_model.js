"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiRagPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    topK: { type: Number, default: 5 },
    similarityThreshold: { type: Number, default: 0.7 },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiRagPolicy", aiRagPolicySchema);
