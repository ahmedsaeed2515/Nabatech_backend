"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const homeBannerSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    targetUrl: { type: String },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    targetZones: { type: [String], default: [] }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("HomeBanner", homeBannerSchema);
