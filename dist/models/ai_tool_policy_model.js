"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiToolPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    allowedTools: { type: [String], default: [] },
    maxExecutionSteps: { type: Number, default: 5 },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiToolPolicy", aiToolPolicySchema);
