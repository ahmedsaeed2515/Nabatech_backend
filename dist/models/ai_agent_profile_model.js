"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiAgentProfileSchema = new mongoose_1.Schema({
    useCase: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    description: { type: String },
    systemPrompt: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiPromptTemplate" },
    routingRule: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiRoutingRule" },
    memoryPolicy: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiMemoryPolicy" },
    toolPolicy: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiToolPolicy" },
    escalationPolicy: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiEscalationPolicy" },
    safetyPolicy: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiSafetyPolicy" },
    ragPolicy: { type: mongoose_1.Schema.Types.ObjectId, ref: "AiRagPolicy" },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiAgentProfile", aiAgentProfileSchema);
