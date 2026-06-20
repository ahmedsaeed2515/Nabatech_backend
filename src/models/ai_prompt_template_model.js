"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var aiPromptTemplateSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, index: true },
    systemPrompt: { type: String, required: true },
    userPromptTemplate: { type: String },
    version: { type: String, default: "1.0.0" },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiPromptTemplate", aiPromptTemplateSchema);
