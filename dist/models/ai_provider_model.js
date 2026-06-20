"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aiProviderSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    baseUrl: { type: String, required: true },
    apiKeyEnc: { type: String, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AiProvider", aiProviderSchema);
