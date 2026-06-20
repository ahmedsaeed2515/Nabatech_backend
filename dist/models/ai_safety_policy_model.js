"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiSafetyPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    blockToxicity: { type: Boolean, default: true },
    detectHallucinations: { type: Boolean, default: true },
    piiRedaction: { type: Boolean, default: false },
    spamProtection: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiSafetyPolicy", aiSafetyPolicySchema);
