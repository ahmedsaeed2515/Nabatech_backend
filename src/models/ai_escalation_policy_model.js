"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var aiEscalationPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    confidenceThreshold: { type: Number, default: 0.5 },
    lowConfidenceAction: { type: String, enum: ["warn", "ask_for_new_image", "block", "route_to_human"], default: "warn" },
    autoEscalateToExpert: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiEscalationPolicy", aiEscalationPolicySchema);
