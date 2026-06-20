"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const homeQuickActionSchema = new mongoose_1.Schema({
    actionId: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    iconName: { type: String, required: true },
    deeplink: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("HomeQuickAction", homeQuickActionSchema);
