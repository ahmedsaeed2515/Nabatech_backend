"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var homeSectionSchema = new mongoose_1.Schema({
    sectionId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["articles", "posts", "products", "custom"], required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    queryConfig: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("HomeSection", homeSectionSchema);
