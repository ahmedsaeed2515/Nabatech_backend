"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiPolicyVersionSchema = new mongoose_1.Schema({
    policyType: { type: String, required: true },
    policyId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    snapshot: { type: mongoose_1.Schema.Types.Mixed, required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiPolicyVersion", aiPolicyVersionSchema);
