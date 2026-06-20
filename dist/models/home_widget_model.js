"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const homeWidgetSchema = new mongoose_1.Schema({
    widgetId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    defaultOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    minAppVersion: { type: String },
    targetRoles: { type: [String], default: ["user"] }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("HomeWidget", homeWidgetSchema);
